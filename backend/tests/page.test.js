const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../app');
const Template = require('../models/templateModel');
const Page = require('../models/pageModel');
const Action = require('../models/actionModel');

beforeAll(async () => {
  await mongoose.connect(process.env.MONGO_URI);
});

afterAll(async () => {
  await mongoose.connection.close();
});

describe('Page API', () => {
  let templateId;

  beforeEach(async () => {
    const template = await Template.create({
      template_name: 'Base Template',
      version: 1,
      publish_status: 'Draft'
    });
    templateId = template._id;
  });

  afterEach(async () => {
    await Template.deleteMany({});
    await Page.deleteMany({});
    await Action.deleteMany({});
  });

  it('POST /api/pages creates a page and logs action', async () => {
    const res = await request(app)
      .post('/api/pages')
      .send({
        page_name: 'Landing Page',
        template: templateId
      });

    expect(res.statusCode).toBe(201);
    expect(res.body.page_name).toBe('Landing Page');
    expect(res.body.template.toString()).toBe(templateId.toString());

    const actionLog = await Action.findOne({ action: 'create_page' });
    expect(actionLog).not.toBeNull();
    expect(actionLog.payload.page_name).toBe('Landing Page');
  });

    it('POST /api/pages fails to create a page', async () => {
    const res = await request(app)
        .post('/api/pages')
        .send({
            page_name: 'Landing Page'  //missing the template
            });
    expect(res.statusCode).toBe(400);
    expect(res.body.message).toBe('Error creating page');
  });
  
  it('GET /api/pages returns all pages', async () => {
    await Page.create({
        page_name: 'Landing Page',
        template: templateId
    });
    const res = await request(app).get('/api/pages');
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);

    expect(res.body.length).toBeGreaterThan(0);
    expect(res.body[0].page_name).toBe('Landing Page');
  });

  
  it('GET /api/pages/:id returns a page', async () => {
    const page = await Page.create({
        page_name: 'Landing Page',
        template: templateId
    });
    const pageId = page._id;
    const res = await request(app).get(`/api/pages/${pageId}`);
    expect(res.statusCode).toBe(200);
    expect(res.body._id).toBe(pageId.toString());
    expect(res.body.page_name).toBe('Landing Page');
  });


  it('PUT /api/pages/:id updates a page and logs action', async () => {
    const page = await Page.create({
        page_name: 'Landing Page',
        template: templateId
    });
    const pageId = page._id;
    const res = await request(app)
      .put(`/api/pages/${pageId}`)
      .send({ page_name: 'Landing Page updated' });
    expect(res.statusCode).toBe(200);
    expect(res.body.page_name).toBe('Landing Page updated');

    const actionLog = await Action.findOne({ action: 'update_page' });
    expect(actionLog.pageId.toString()).toBe(pageId.toString());
    expect(actionLog.payload.updateFields.page_name).toBe('Landing Page updated');
  });
  
  it('PUT /api/pages/:id fails to update a page', async () => {
    const res = await request(app)
      .put('/api/pages/invalid-page-id')
      .send({ page_name: 'Landing Page updated' });

    expect(res.statusCode).toBe(400);
    expect(res.body.message).toBe('Error updating page');
  });
  
  it('DELETE /api/pages/:id deletes a page and logs action', async () => {
    const page = await Page.create({
        page_name: 'Landing Page',
        template: templateId
    });
    const pageId = page._id;
    const res = await request(app).delete(`/api/pages/${pageId}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.message).toBe('Page deleted successfully');

    const actionLog = await Action.findOne({ action: 'delete_page' });
    expect(actionLog.pageId.toString()).toBe(pageId.toString());
    expect(actionLog.payload.deletedPageName).toBe('Landing Page');
  });
  
  it('DELETE /api/pages/:id fails to delete a page', async () => {
    const res = await request(app).delete('/api/pages/not-valid-id');
    expect(res.statusCode).toBe(500);
    expect(res.body.message).toBe('Error deleting page');
  });

});