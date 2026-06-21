# ComfyUI-Model-Location-Editor

**ComfyUI-Model-Location-Editor** is a utility extension for [ComfyUI](https://github.com/comfyanonymous/ComfyUI) that allows you to attach provisioning metadata—such as **Download URLs** and **Target Directories**—directly to your model-loading nodes.

Instead of manually tracking where each model should be saved or where to download it from, this extension embeds that information directly into the workflow's node properties. It is designed to simplify modular workflows, making it easier to share templates and use automated model download systems.

---

## Key Features

* **Node-Specific Metadata:** Attach custom metadata to Checkpoint, Lora, VAE, and CLIP loaders.
* **Intelligent Auto-Seeding:** Automatically detects models currently selected in your widgets and seeds the editor with their filenames and inferred directory types.
* **Adaptive Compatibility:** Seamlessly integrates with standard ComfyUI nodes, single-purpose loaders (like LTXV), and complex third-party loaders (like **rgthree’s Power Lora Loader**).
* **Smart Deduplication:** Automatically avoids duplicate entries if a model is referenced in multiple places.
* **Theme-Aware UI:** Adheres to your active ComfyUI theme's typography, colors, and styling for a native experience.
* **Auto-Cleanup:** Automatically purges entries missing a `Download URL` upon saving, keeping your project properties clean.

---

## Installation

1.  Navigate to your `ComfyUI/custom_nodes` directory.
2.  Clone the repository:
    ```bash
    git clone [https://github.com/angzam78/ComfyUI-Model-Location-Editor](https://github.com/angzam78/ComfyUI-Model-Location-Editor)
    ```
3.  Restart ComfyUI.

---

## How to Edit Model Location Metadata

1.  **Open the Menu:** Right-click on any node that loads a model (e.g., `Load Checkpoint`, `Lora Loader`).
2.  **Edit Location Metadata:** Select **"⚙️ Edit Location Metadata"** from the context menu.
3.  **Review/Configure:** The editor will open.
    * **Add:** Click "Add New Model Entry" to manually define a model.
    * **Edit:** Update the `Download URL` or `Target Directory`.
    * **Remove:** Use the "Remove" button to delete an entry.
4.  **Save:** Click "Save Changes" to store the metadata directly within the node's properties.

> **Tip:** If an entry does not have a set `Download URL`, clicking "Save Changes" is equivalent to deleting that entry.

---

## Use Case: Automated Workflow Provisioning
This extension is designed to work as a "Data Provider" for model management tools. A powerful use case is pairing this editor with the [ComfyUI-Workflow-Models-Downloader](https://github.com/slahiri/ComfyUI-Workflow-Models-Downloader):

1.  **Configure:** Use the **Model-Location-Editor** to attach Download URLs to your specific loader nodes within a workflow.
2.  **Save:** Save your workflow as a JSON file. The metadata you entered is now embedded directly into the node properties.
3.  **Deploy:** When sharing this workflow, the **Workflow-Models-Downloader** can detect these embedded URLs, recognize them as the intended source, and automatically handle the download and placement process on the recipient's machine.

---
## Compatibility

* **Standard Nodes:** Works out-of-the-box with native ComfyUI loaders.
* **Custom Suites:** Includes specialized handling for complex objects like **rgthree-comfy**'s Power Lora Loader.
* **UI:** Fully respects ComfyUI CSS variables for colors, fonts, and sizes.
