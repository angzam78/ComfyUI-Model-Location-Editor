import { app } from "/scripts/app.js";
import { ComfyDialog } from "/scripts/ui.js";

/**
 * LocationMetadataEditorDialog
 * An extension for ComfyUI that attaches model location metadata 
 * to model-loading nodes.
 */
class LocationMetadataEditorDialog extends ComfyDialog {
    constructor(targetNode) {
        super();
        this.targetNode = targetNode;
        this.targetNode.properties = this.targetNode.properties || {};
        
        const existing = this.targetNode.properties["models"];
        this.models = existing ? JSON.parse(JSON.stringify(existing)) : [];

        // 1. Scan active widgets to build a list of all currently selected models
        const activeWidgetModels = [];
        (this.targetNode.widgets || []).forEach(w => {
            const name = w.name?.toLowerCase() || "";
            let valStr = "";

            // Handle standard strings and complex rgthree objects
            if (typeof w.value === "string") {
                valStr = w.value;
            } else if (w.value && typeof w.value === "object") {
                valStr = w.value.lora || w.value.field || "";
            }

            if (!valStr || valStr === "None") return;

            const hasModelExtension = /\.(safetensors|ckpt|pt|bin|th)$/i.test(valStr);
            const isModelWidgetName = name.includes("model") || name.includes("ckpt") || name.includes("lora") || name.includes("vae") || name.includes("encoder") || name.includes("clip");

            if (hasModelExtension || isModelWidgetName) {
                let dir = "checkpoints";
                
                if (name.includes("lora")) dir = "loras";
                else if (name.includes("vae")) dir = "vae";
                else if (name.includes("controlnet")) dir = "controlnet";
                else if (name.includes("clip") || name.includes("encoder") || name.includes("t5")) dir = "text_encoders";
                else if (name.includes("unet") || name.includes("diffusion")) dir = "unet";

                const filename = valStr.split(/[/\\]/).pop();
                
                if (!activeWidgetModels.some(m => m.name === filename)) {
                    activeWidgetModels.push({ name: filename, url: "", directory: dir });
                }
            }
        });

        // 2. Cross-reference: Incrementally append only missing models to the list
        activeWidgetModels.forEach(widgetModel => {
            const alreadyExists = this.models.some(m => m.name === widgetModel.name);
            if (!alreadyExists) {
                this.models.push(widgetModel);
            }
        });

        // Styling using ComfyUI theme variables for native feel
        Object.assign(this.element.style, {
            width: "550px", maxHeight: "85vh", display: "flex", flexDirection: "column",
            background: "var(--comfy-menu-bg, var(--bg-color, #1a1a1a))", 
            border: "2px solid var(--border-color, #444)", 
            borderRadius: "8px", padding: "16px 20px", boxSizing: "border-box",
            fontFamily: "var(--font-sans, system-ui, -apple-system, sans-serif)",
            color: "var(--fg-color, #fff)"
        });
        this.element.classList.add("comfy-processor-dialog");
        this.element.innerHTML = "";

        this.standardDirectories = [
            "checkpoints", "clip", "clip_vision", "controlnet", "diffusion_models", "embeddings", 
            "gligen", "hypernetworks", "loras", "style_models", "text_encoders", "unet", "upscale_models", "vae", "vae_approx"
        ];
    }

    createButtons() { return []; }

    show() {
        this.renderLayout();
        super.show();
        // Remove trailing undefined artifacts from DOM
        Array.from(this.element.childNodes).forEach(n => n.nodeType === Node.TEXT_NODE && n.nodeValue.includes("undefined") && n.remove());
    }

    ui(type, styles, props = {}) {
        const el = document.createElement(type);
        Object.assign(el.style, styles);
        Object.assign(el, props);
        return el;
    }

    createBtn(text, bg, hoverBg, onClick) {
        const btn = this.ui("button", { 
            backgroundColor: bg, 
            color: "var(--pmenu-text, var(--fg-color, #fff))", 
            border: "none", borderRadius: "4px", cursor: "pointer", 
            transition: "background 0.2s", fontFamily: "inherit" 
        }, { innerText: text, type: "button", onclick: onClick });
        btn.onmouseenter = () => btn.style.backgroundColor = hoverBg;
        btn.onmouseleave = () => btn.style.backgroundColor = bg;
        return btn;
    }

    createField(labelText, value, onChange, isDropdown = false) {
        const row = this.ui("div", { display: "flex", flexDirection: "column", gap: "4px", width: "100%" });
        row.appendChild(this.ui("label", { 
            fontSize: "var(--desc-text-size, 11px)", 
            color: "var(--drag-text-color, #ccc)", 
            fontFamily: "inherit" 
        }, { innerText: labelText }));

        const inputStyles = { 
            padding: "6px 8px", 
            backgroundColor: "var(--comfy-input-bg, #2a2a2a)", 
            color: "var(--comfy-input-text, var(--fg-color, #fff))", 
            border: "1px solid var(--border-color, #444)", 
            borderRadius: "4px", 
            fontSize: "var(--comfy-input-text-size, 13px)", 
            width: "100%", boxSizing: "border-box", outline: "none", 
            transition: "border-color 0.15s", fontFamily: "inherit" 
        };
        const input = this.ui("input", inputStyles, { type: "text", value: value, oninput: (e) => onChange(e.target.value) });
        input.onfocus = () => input.style.borderColor = "var(--error-text, #4a90e2)";
        input.onblur = () => input.style.borderColor = "var(--border-color, #444)";

        if (!isDropdown) {
            row.appendChild(input);
        } else {
            const wrap = this.ui("div", { display: "flex", width: "100%", boxSizing: "border-box" });
            Object.assign(input.style, { borderRight: "none", borderRadius: "4px 0 0 4px", flexGrow: "1", width: "0" });
            
            const arrow = this.createBtn("▼", "var(--comfy-input-bg, #3a3a3a)", "var(--border-color, #4a4a4a)", (e) => {
                e.preventDefault();
                const opts = this.standardDirectories.map(dir => ({ content: dir, callback: () => { input.value = dir; onChange(dir); } }));
                new LiteGraph.ContextMenu(opts, { event: e, scale: 1.0, className: "dark" });
            });
            Object.assign(arrow.style, { 
                width: "36px", height: "auto", display: "flex", alignItems: "center", justifyContent: "center", 
                color: "var(--drag-text-color, #aaa)", border: "1px solid var(--border-color, #444)", 
                borderRadius: "0 4px 4px 0", fontSize: "10px", boxSizing: "border-box", flexShrink: "0" 
            });
            
            wrap.append(input, arrow);
            row.appendChild(wrap);
        }
        return row;
    }

    renderLayout() {
        this.element.innerHTML = "";

        this.element.appendChild(this.ui("h3", { 
            margin: "0 0 16px 0", color: "var(--fg-color, #fff)", 
            fontSize: "var(--comfy-menu-text-size, 16px)", fontWeight: "600", fontFamily: "inherit" 
        }, { innerText: `⚙️ Model Location Metadata: ${this.targetNode.title || this.targetNode.type}` }));

        const scroll = this.element.appendChild(this.ui("div", { display: "flex", flexDirection: "column", gap: "14px", width: "100%", overflowY: "auto", flexGrow: "1", paddingRight: "4px", boxSizing: "border-box" }));

        this.models.forEach((model, idx) => {
            const box = scroll.appendChild(this.ui("div", { 
                border: "1px solid var(--border-color, #333)", 
                backgroundColor: "var(--node-bg, #222)", 
                padding: "14px", borderRadius: "6px", display: "flex", flexDirection: "column", gap: "10px", boxSizing: "border-box" 
            }));
            const hdr = box.appendChild(this.ui("div", { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2px" }));
            
            hdr.appendChild(this.ui("span", { fontSize: "var(--comfy-input-text-size, 13px)", fontWeight: "600", color: "var(--drag-text-color, #aaa)", fontFamily: "inherit" }, { innerText: `Model Entry #${idx + 1}` }));
            
            const removeBtn = this.createBtn("🗑️ Remove", "#552222", "#883333", () => { this.models.splice(idx, 1); this.renderLayout(); });
            Object.assign(removeBtn.style, { padding: "4px 10px", fontSize: "11px", fontWeight: "500", borderRadius: "4px" });
            hdr.appendChild(removeBtn);

            box.appendChild(this.createField("Model Filename:", model.name || "", (val) => this.models[idx].name = val));
            box.appendChild(this.createField("Download URL:", model.url || "", (val) => this.models[idx].url = val));
            box.appendChild(this.createField("Target Directory:", model.directory || "checkpoints", (val) => this.models[idx].directory = val, true));
        });

        const addBtn = this.createBtn("➕ Add New Model Entry", "#1b5e20", "#2e7d32", () => { this.models.push({ name: "", url: "", directory: "checkpoints" }); this.renderLayout(); });
        Object.assign(addBtn.style, { padding: "6px 12px", fontSize: "var(--desc-text-size, 12px)", fontWeight: "600", width: "fit-content", marginTop: "4px" });
        scroll.appendChild(addBtn);

        const footer = this.element.appendChild(this.ui("div", { display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "16px", borderTop: "1px solid var(--border-color, #333)", paddingTop: "14px" }));
        
        const cancel = this.createBtn("Cancel", "var(--comfy-input-bg, #3a3a3a)", "var(--border-color, #4a4a4a)", () => this.close());
        
        const save = this.createBtn("Save Changes", "#1976d2", "#2196f3", () => {
            // Delete entries that have empty URLs on save
            const cleanedModels = this.models.filter(model => model.url && model.url.trim() !== "");
            this.targetNode.properties["models"] = cleanedModels;
            app.canvas.setDirty(true, true);
            this.close();
        });
        
        Object.assign(cancel.style, { padding: "7px 16px", fontSize: "var(--desc-text-size, 12px)", fontWeight: "500" });
        Object.assign(save.style, { padding: "7px 16px", fontSize: "12px", fontWeight: "600" });
        
        footer.append(cancel, save);
    }
}

app.registerExtension({
    name: "Comfy.PopupMetadataMenuEditor",
    async beforeRegisterNodeDef(nodeType) {
        const oldMenu = nodeType.prototype.getExtraMenuOptions;
        nodeType.prototype.getExtraMenuOptions = function(canvas, options) {
            if (oldMenu) oldMenu.apply(this, arguments);

            // Filter context menu: Only show on nodes with model-related widgets
            const hasModelWidget = this.widgets?.some(w => {
                const name = w.name?.toLowerCase() || "";
                const valStr = typeof w.value === "string" ? w.value : (w.value?.lora || w.value?.field || "");
                return name.includes("model") || name.includes("ckpt") || name.includes("lora") || name.includes("vae") || name.includes("encoder") || name.includes("clip") || /\.(safetensors|ckpt|pt|bin|th)$/i.test(valStr);
            });

            if (hasModelWidget) {
                options.push(null, { content: "⚙️ Edit Model Location Metadata", callback: () => new LocationMetadataEditorDialog(this).show() });
            }
        };
    }
});
