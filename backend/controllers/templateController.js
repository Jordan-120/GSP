const mongoose = require("mongoose");
const Template = require("../models/templateModel");
const Action = require("../models/actionModel");
const User = require("../models/userModel");

//Controller function to create a new template
const createTemplate = async (req, res) => {
  console.log("Incoming body:", req.body);
  console.log("Incoming user:", req.user);

  try {
    const newTemplate = new Template({
      ...req.body,
      userId: req.user?.id,
      updated_at: new Date(),
    });

    await newTemplate.save();

    // updating the user with template id.
    try {
      console.log("req.user in createTemplate:", req.user);
      if (!req.user.id && req.user.email) {
        const sqlUser = await User.findOne({ where: { email: req.user.email } });
        console.log("SQL user found:", sqlUser ? sqlUser.toJSON() : null);
        if (sqlUser) req.user.id = sqlUser.id;
      }
      const [updatedCount] = await User.update(
        { last_template_id: newTemplate._id.toString() },
        { where: { id: req.user.id } }
      );
      console.log("Rows updated:", updatedCount);
    } catch (sqlError) {
      console.error("MySQL update failed:", sqlError.message);
    }

    //Logging the action
    await Action.create({
      userId: req.user ? req.user._id : null,
      templateId: newTemplate._id,
      action: "create_template",
      payload: { template_name: newTemplate.template_name },
    });

    res.status(201).json(newTemplate);
  } catch (error) {
    console.error("Error creating template:", error);
    res.status(400).json({ message: "Error creating template", error });
  }
};

//Controller function to get templates
// Registered users should only see their own templates
// Admins may see all (optional, but useful for debugging)
const getAllTemplates = async (req, res) => {
  try {
    const role = req.user?.profile_type;

    if (role === "Admin") {
      const templates = await Template.find().sort({ updated_at: -1 }).lean();
      return res.status(200).json(templates);
    }

    const templates = await Template.find({ userId: req.user.id })
      .sort({ updated_at: -1 })
      .lean();

    res.status(200).json(templates);
  } catch (error) {
    res.status(500).json({ message: "Error retrieving templates", error });
  }
};

//Controller function to get a specific template by ID
const getTemplateById = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid template ID format" });
    }

    const template = await Template.findById(id).lean();
    if (!template) return res.status(404).json({ message: "Template not found" });

    // If not admin, must own the template
    if (req.user.profile_type !== "Admin" && template.userId !== req.user.id) {
      return res.status(403).json({ message: "Forbidden" });
    }

    res.status(200).json(template);
  } catch (error) {
    console.error("Error retrieving template:", error.message);
    res.status(500).json({ message: "Error retrieving template", error: error.message });
  }
};

//Controller function to update a template by ID
const updateTemplate = async (req, res) => {
  try {
    const existing = await Template.findById(req.params.id).lean();
    if (!existing) return res.status(404).json({ message: "Template not found" });

    if (req.user.profile_type !== "Admin" && existing.userId !== req.user.id) {
      return res.status(403).json({ message: "Forbidden" });
    }

    const template = await Template.findByIdAndUpdate(
      req.params.id,
      { ...req.body, updated_at: new Date() },
      { new: true }
    );

    //Loging the action
    await Action.create({
      userId: req.user ? req.user._id : null,
      templateId: template._id,
      action: "update_template",
      payload: {
        updatedTemplateId: template._id,
        updatedFields: req.body,
      },
    });

    res.status(200).json(template);
  } catch (error) {
    res.status(400).json({ message: "Error updating template", error });
  }
};

//Controller function to delete a template by ID
const deleteTemplate = async (req, res) => {
  try {
    const existing = await Template.findById(req.params.id).lean();
    if (!existing) return res.status(404).json({ message: "Template not found" });

    if (req.user.profile_type !== "Admin" && existing.userId !== req.user.id) {
      return res.status(403).json({ message: "Forbidden" });
    }

    const template = await Template.findByIdAndDelete(req.params.id);

    //Loging the action
    await Action.create({
      userId: req.user ? req.user._id : null,
      templateId: template._id,
      action: "delete_template",
      payload: {
        deletedTemplateId: template._id,
        deletedTemplateName: template.template_name,
      },
    });

    res.status(200).json({ message: "Template deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error deleting template", error });
  }
};

// Controller function to get just the pages for a template (used by admin preview)
// GET /api/templates/:id/pages
const getTemplatePages = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid template ID format" });
    }

    const template = await Template.findById(id).lean();
    if (!template) return res.status(404).json({ message: "Template not found" });

    // Admin can view any. Non-admin must own.
    if (req.user.profile_type !== "Admin" && template.userId !== req.user.id) {
      return res.status(403).json({ message: "Forbidden" });
    }

    const pages = Array.isArray(template.pages) ? template.pages : [];

    const wrappedPages = pages.map((p, idx) => {
      const content = p && typeof p.content === "string" ? p.content : "";
      const style = p?.style || {};
      const bg = style.backgroundColor || "#ffffff";

      const isFullDoc = /^\s*<!doctype\s+html|^\s*<html[\s>]/i.test(content);

      const html = isFullDoc
        ? content
        : `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <style>
    body { margin: 0; padding: 16px; background: ${bg}; font-family: Arial, sans-serif; }
  </style>
</head>
<body>
${content}
</body>
</html>`;

      return {
        pageNumber: idx + 1,
        name: p?.name || `Page ${idx + 1}`,
        html,
      };
    });

    res.status(200).json({ template_id: template._id, pages: wrappedPages });
  } catch (error) {
    console.error("Error retrieving template pages:", error.message);
    res.status(500).json({ message: "Error retrieving template pages", error: error.message });
  }
};

// User requests publish (or resubmits after Denied)
// PATCH /api/templates/:id/request-publish
const requestPublish = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid template ID format" });
    }

    const template = await Template.findById(id);
    if (!template) return res.status(404).json({ message: "Template not found" });

    if (req.user.profile_type !== "Admin" && template.userId !== req.user.id) {
      return res.status(403).json({ message: "Forbidden" });
    }

    template.publish_status = "Requested";

    // Clear denial metadata so next submission is fresh
    template.denied_reason_code = null;
    template.denied_reason_text = null;
    template.denied_at = null;
    template.reviewed_by = null;
    template.reviewed_at = null;

    template.updated_at = new Date();
    await template.save();

    res.status(200).json({
      message: "Template submitted for publishing approval.",
      template,
    });
  } catch (error) {
    console.error("requestPublish error:", error.message);
    res.status(500).json({ message: "Error submitting template for publish", error: error.message });
  }
};

/* ---------------- Published Template Library ---------------- */

// GET /api/templates/published?search=term
const listPublishedTemplates = async (req, res) => {
  try {
    const search = (req.query.search || "").trim();
    const query = { publish_status: "Published" };

    if (search) {
      query.template_name = { $regex: search, $options: "i" };
    }

    const templates = await Template.find(query)
      .sort({ updated_at: -1, created_at: -1 })
      .select("_id template_name version userId publish_status created_at updated_at")
      .lean();

    res.status(200).json(templates);
  } catch (error) {
    console.error("listPublishedTemplates error:", error.message);
    res.status(500).json({ message: "Error retrieving published templates", error: error.message });
  }
};

// GET /api/templates/published/:id/pages
const getPublishedTemplatePages = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid template ID format" });
    }

    const template = await Template.findById(id).lean();
    if (!template) return res.status(404).json({ message: "Template not found" });

    if (template.publish_status !== "Published") {
      return res.status(403).json({ message: "Template is not published" });
    }

    const pages = Array.isArray(template.pages) ? template.pages : [];

    const wrappedPages = pages.map((p, idx) => {
      const content = p && typeof p.content === "string" ? p.content : "";
      const style = p?.style || {};
      const bg = style.backgroundColor || "#ffffff";

      const isFullDoc = /^\s*<!doctype\s+html|^\s*<html[\s>]/i.test(content);

      const html = isFullDoc
        ? content
        : `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <style>
    body { margin: 0; padding: 16px; background: ${bg}; font-family: Arial, sans-serif; }
  </style>
</head>
<body>
${content}
</body>
</html>`;

      return {
        pageNumber: idx + 1,
        name: p?.name || `Page ${idx + 1}`,
        html,
      };
    });

    res.status(200).json({ template_id: template._id, pages: wrappedPages });
  } catch (error) {
    console.error("getPublishedTemplatePages error:", error.message);
    res.status(500).json({ message: "Error retrieving published template pages", error: error.message });
  }
};

// POST /api/templates/published/:id/copy
const copyPublishedTemplateToUser = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid template ID format" });
    }

    const source = await Template.findById(id).lean();
    if (!source) return res.status(404).json({ message: "Template not found" });

    if (source.publish_status !== "Published") {
      return res.status(403).json({ message: "Template is not published" });
    }

    const copyName = `${source.template_name} (Copy)`;

    const newTemplate = new Template({
      userId: req.user.id,
      template_name: copyName,
      version: 1,
      publish_status: "Draft",
      denied_reason_code: null,
      denied_reason_text: null,
      denied_at: null,
      reviewed_by: null,
      reviewed_at: null,
      pages: Array.isArray(source.pages) ? source.pages : [],
      created_at: new Date(),
      updated_at: new Date(),
    });

    await newTemplate.save();

    await Action.create({
      userId: req.user ? req.user._id : null,
      templateId: newTemplate._id,
      action: "copy_published_template",
      payload: { sourceTemplateId: source._id, template_name: copyName },
    });

    res.status(201).json({ message: "Template copied to your account.", template: newTemplate });
  } catch (error) {
    console.error("copyPublishedTemplateToUser error:", error.message);
    res.status(500).json({ message: "Error copying published template", error: error.message });
  }
};

module.exports = {
  createTemplate,
  getAllTemplates,
  getTemplateById,
  getTemplatePages,
  updateTemplate,
  deleteTemplate,
  requestPublish,
  listPublishedTemplates,
  getPublishedTemplatePages,
  copyPublishedTemplateToUser,
};