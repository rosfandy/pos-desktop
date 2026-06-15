# ── Structurizr C4 Diagram Tools ──────────────────────────────────────────────
# Serve, validate, and render C4 architecture diagrams (Structurizr DSL).
#
# Diagram DSL files:      docs/architecture/*.dsl
# Rendered PlantUML:      docs/diagram/*.puml
#
# Prerequisites:
#   - Docker installed and running
#   - `make` available (use `mingw32-make` on Windows, `make` on Linux/Mac)
#
# Targets:
#   server       [default] Structurizr vNext → http://localhost:8080
#   validate     Validate all DSL files
#   plantuml     Export all DSL ke PlantUML (.puml)
#   render       Alias untuk plantuml (render diagram)
#   info         Show DSL files found

# ── Config ──────────────────────────────────────────────────────────────────
DSL_DIR   := docs/architecture
DATA_DIR  := $(PWD)/$(DSL_DIR)
OUT_DIR   := docs/diagram
PWD       := $(shell pwd 2>/dev/null || echo "%CD%")
WORKSPACE := $(DSL_DIR)/workspace.dsl

# ── Server (default) ─────────────────────────────────────────────────────────
# Structurizr vNext — hot-reload development server
#   https://github.com/structurizr/structurizr
#   http://localhost:8080
.DEFAULT_GOAL := server

server:
	@echo "→  Structurizr vNext di http://localhost:8080  (hot-reload, watch $(DSL_DIR)/)"
	docker run -it --rm -p 8080:8080 -v "$(DATA_DIR):/usr/local/structurizr" structurizr/structurizr local

# ── Validate ─────────────────────────────────────────────────────────────────
validate:
	@echo "→  Validasi $(DSL_DIR)/workspace.dsl ..."
	docker run --rm -v "$(DATA_DIR):/usr/local/structurizr" structurizr/structurizr validate -w workspace.dsl
	@echo "✔  Valid"

# ── Export to PlantUML ───────────────────────────────────────────────────────
plantuml: render

render:
	@mkdir -p $(OUT_DIR)
	@echo "→  Render $(DSL_DIR)/workspace.dsl ..."
	docker run --rm -v "$(DATA_DIR):/usr/local/structurizr" structurizr/structurizr export \
		-w workspace.dsl \
		-f plantuml
	@echo "✔  Output di $(DATA_DIR)/"
	@ls -1 $(DATA_DIR)/structurizr-*.puml 2>/dev/null || echo "   (tidak ada output)"

# ── Info ─────────────────────────────────────────────────────────────────────
info:
	@echo "Struktur $(DSL_DIR)/:"
	@find $(DSL_DIR) -type f | sort | sed 's/^/  /'
	@echo ""
	@echo "Target:"
	@echo "  make server       → Structurizr vNext  http://localhost:8080"
	@echo "  make validate     → Validasi workspace.dsl"
	@echo "  make render       → Export ke PlantUML (.puml)"

# ── Clean ───────────────────────────────────────────────────────────────────
clean:
	rm -f $(DATA_DIR)/structurizr-*.puml $(DATA_DIR)/workspace.json
	@echo "✔  Bersih"

# ── Phony ───────────────────────────────────────────────────────────────────
.PHONY: server validate plantuml render info clean
