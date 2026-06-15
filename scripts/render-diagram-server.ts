/**
 * Structurizr Diagram Render Server
 *
 * POST /render  { "dsl": "<structurizr dsl string>" }
 * →            { "svg": "<svg string>", "plantuml": "<plantuml string>" }
 *
 * Uses the Structurizr Lite / public cloud API to render C4 model diagrams
 * defined in Structurizr DSL. No Java / mmdc required.
 */

import express from 'express';
import cors from 'cors';
import { execSync } from 'child_process';
import { writeFileSync, mkdirSync, rmSync, existsSync } from 'fs';
import { join, resolve } from 'path';

const app = express();
app.use(cors());
app.use(express.json({ limit: '1mb' }));

const PORT = process.env.DIAGRAM_RENDER_PORT || 4176;
const TMP_DIR = join(resolve(), 'tmp-diagrams');

if (!existsSync(TMP_DIR)) mkdirSync(TMP_DIR, { recursive: true });

// Structurizr API helpers
const STRUCTURIZR_API = process.env.STRUCTURIZR_API || 'https://api.structurizr.com';

/**
 * Push a workspace to Structurizr Cloud (public workspace, 1 view).
 * Requires STRUCTURIZR_API_KEY env var.
 */
async function pushWorkspace(id: number, dsl: string): Promise<string> {
  const apiKey = process.env.STRUCTURIZR_API_KEY;
  if (!apiKey) {
    throw new Error('STRUCTURIZR_API_KEY environment variable is not set.');
  }

  // 1. Get current workspace
  const getRes = await fetch(`${STRUCTURIZR_API}/workspace/${id}`, {
    headers: { 'Authorization': `Basic ${Buffer.from(`${apiKey}:`).toString('base64')}` },
  });
  if (!getRes.ok) throw new Error(`Failed to fetch workspace: ${getRes.status}`);
  const workspace = await getRes.json();

  // 2. Parse DSL and merge into workspace payload
  // Structurizr REST API expects the full workspace JSON; we inject the new model.
  // The simplest reliable path: use the /workspace/{id}/lock → /workspace/{id} PUT flow.
  // For MVP we POST the full workspace body with the updated model.
  workspace.model = parseDslToModel(dsl);

  const putRes = await fetch(`${STRUCTURIZR_API}/workspace/${id}`, {
    method: 'PUT',
    headers: {
      'Authorization': `Basic ${Buffer.from(`${apiKey}:`).toString('base64')}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(workspace),
  });

  if (!putRes.ok) {
    const body = await putRes.text();
    throw new Error(`Structurizr API error ${putRes.status}: ${body}`);
  }

  return (await putRes.json()) as string;
}

/**
 * Very lightweight DSL → model parser.
 * Extracts workspaces, models (people/systems/containers/components/relationships),
 * and views from Structurizr DSL.
 */
function parseDslToModel(dsl: string): Record<string, unknown> {
  const model: Record<string, unknown> = { people: {}, systems: {}, containers: {}, components: {}, relationships: [] };
  const views: Record<string, unknown> = {};

  const workspaceMatch = dsl.match(/workspace\s+"([^"]+)"\s*,\s*"([^"]+)"\s*\{/);
  if (workspaceMatch) {
    model.name = workspaceMatch[1];
    model.description = workspaceMatch[2];
  }

  // Parse model blocks
  const modelBlockMatch = dsl.match(/model\s*\{([\s\S]*?)\n\s*\}/);
  if (modelBlockMatch) {
    const block = modelBlockMatch[1];

    const personRe = /person\s+(\w+)\s*,\s*"([^"]+)"\s*,\s*"([^"]+)"[^}]*\}/g;
    let m: RegExpExecArray | null;
    while ((m = personRe.exec(block)) !== null) {
      (model.people as Record<string, unknown>)[m[1]] = { id: m[1], name: m[2], description: m[3] };
    }

    const systemRe = /system\s+(\w+)\s*,\s*"([^"]+)"\s*,\s*"([^"]+)"[^}]*\}/g;
    while ((m = systemRe.exec(block)) !== null) {
      (model.systems as Record<string, unknown>)[m[1]] = { id: m[1], name: m[2], description: m[3] };
    }

    const containerRe = /container\s+(\w+)\s*,\s*"([^"]+)"\s*,\s*"([^"]+)"[^}]*\}/g;
    while ((m = containerRe.exec(block)) !== null) {
      (model.containers as Record<string, unknown>)[m[1]] = { id: m[1], name: m[2], description: m[3] };
    }

    const componentRe = /component\s+(\w+)\s*,\s*"([^"]+)"\s*,\s*"([^"]+)"[^}]*\}/g;
    while ((m = componentRe.exec(block)) !== null) {
      (model.components as Record<string, unknown>)[m[1]] = { id: m[1], name: m[2], description: m[3] };
    }

    // Parse relationships
    const relRe = /(\w+)\s+->\s+(\w+)\s*:\s*"([^"]+)"/g;
    while ((m = relRe.exec(block)) !== null) {
      (model.relationships as unknown[]).push({
        id: `${m[1]}_${m[2]}`,
        sourceId: m[1],
        destinationId: m[2],
        description: m[3],
      });
    }
  }

  // Parse views block
  const viewsMatch = dsl.match(/views\s*\{([\s\S]*?)\n\s*\}/);
  if (viewsMatch) {
    const vb = viewsMatch[1];

    const themeMatch = vb.match(/theme\s+"([^"]+)"/);
    if (themeMatch) views.theme = themeMatch[1];

    const styleMatch = vb.match(/styles\s*\{([\s\S]*?)\n\s*\}/);
    if (styleMatch) views.styles = styleMatch[1].trim();

    const layerRe = /(\w+)\s*\{([\s\S]*?)\n\s*\}/g;
    let lv: RegExpExecArray | null;
    while ((lv = layerRe.exec(vb)) !== null) {
      const layerName = lv[1];
      if (['systemLandscape', 'container', 'component', 'deployment', 'dynamic'].includes(layerName)) {
        views[layerName] = lv[2].trim();
      }
    }
  }

  return { ...model, views } as Record<string, unknown>;
}

/**
 * Fetch the diagram SVG from Structurizr.
 * We embed the DSL into the workspace, then read the diagram back.
 */
async function fetchDiagramFromStructurizr(id: number, apiKey: string, dsl: string): Promise<string> {
  // Push DSL as workspace
  const workspaceJson = await pushWorkspace(id, dsl);

  // Re-fetch workspace to get the diagram key
  const getRes = await fetch(`${STRUCTURIZR_API}/workspace/${id}/diagram?format=png`, {
    headers: { 'Authorization': `Basic ${Buffer.from(`${apiKey}:`).toString('base64')}` },
  });
  if (!getRes.ok) throw new Error(`Failed to fetch diagram: ${getRes.status}`);

  const buf = await getRes.arrayBuffer();
  return Buffer.from(buf).toString('base64');
}

// ---------------------------------------------------------------------------
// HTTP routes
// ---------------------------------------------------------------------------

/**
 * POST /render
 * Body: { "dsl": "<structurizr dsl source>" }
 * Returns: { "svg": "<svg string>" }  (SVG rendered via Structurizr public API)
 *
 * Environment:
 *   STRUCTURIZR_API_KEY   required — Structurizr Cloud/self-hosted API key
 *   STRUCTURIZR_WORKSPACE_ID  optional — workspace ID to reuse (default: 39825)
 *   STRUCTURIZR_API       optional — API base URL (default: https://api.structurizr.com)
 */
app.post('/render', async (req, res) => {
  const { dsl } = req.body;

  if (!dsl || typeof dsl !== 'string') {
    return res.status(400).json({ error: 'Missing or invalid "dsl" field in request body.' });
  }

  const apiKey = process.env.STRUCTURIZR_API_KEY;
  if (!apiKey) {
    return res.status(500).json({
      error: 'STRUCTURIZR_API_KEY is not set.',
      hint: 'Set the environment variable to your Structurizr Cloud API key, or run structurizr-lite locally.',
    });
  }

  const workspaceId = parseInt(process.env.STRUCTURIZR_WORKSPACE_ID || '39825', 10);

  try {
    // Push workspace
    await pushWorkspace(workspaceId, dsl);

    // Fetch rendered diagram as PNG → convert to SVG via sharp if available,
    // otherwise return base64 PNG.
    const diagramRes = await fetch(`${STRUCTURIZR_API}/workspace/${workspaceId}/diagram?format=png`, {
      headers: { 'Authorization': `Basic ${Buffer.from(`${apiKey}:`).toString('base64')}` },
    });

    if (!diagramRes.ok) throw new Error(`Diagram fetch failed: ${diagramRes.status}`);
    const pngBuf = Buffer.from(await diagramRes.arrayBuffer());

    // Try sharp → SVG
    let svg = '';
    try {
      const sharp = (await import('sharp')).default;
      const { svg: svgData } = await sharp(pngBuf).svg().toBuffer({ resolveWithObject: true });
      svg = svgData.toString('utf-8');
    } catch {
      // sharp not available — return PNG as base64 data URI
      svg = `<img src="data:image/png;base64,${pngBuf.toString('base64')}" />`;
    }

    res.json({ svg });
  } catch (err: unknown) {
    console.error('[structurizr-render] error:', err);
    const message = err instanceof Error ? err.message : String(err);
    res.status(500).json({ error: 'Failed to render diagram.', details: message });
  }
});

/**
 * GET /health
 */
app.get('/health', (_req, res) => res.json({ ok: true, service: 'structurizr-render', port: PORT }));

app.listen(PORT, () => {
  console.log(`[structurizr-render] Listening on http://localhost:${PORT}`);
  console.log('[structurizr-render] POST /render  body: { "dsl": "<structurizr-dsl>" }');
  console.log('[structurizr-render] GET  /health');
});
