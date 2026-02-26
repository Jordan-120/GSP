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

describe('Section CRUD API, nested in Page schema', () => {
  let templateId;
  let pageId;

  beforeEach(async () => {
    const template = await Template.create({
      template_name: 'Landing Template',
      version: 1,
      publish_status: 'Draft'
    });
    templateId = template._id;

    const page = await Page.create({
      page_name: 'Landing Page',
      template: templateId
    });
    pageId = page._id;

  });

  afterEach(async () => {
    await Template.deleteMany({});
    await Page.deleteMany({});
    await Action.deleteMany({});
  });
  it('POST /api/pages/:pageId/sections creates a section and logs action', async () => {
    const res = await request(app)
        .post(`/api/pages/${pageId}/sections`)
        .send({ section_title: 'Section title'});
    expect(res.statusCode).toBe(201);
    expect(res.body.section_title).toBe('Section title');
    
    const updatedPage = await Page.findById(pageId);
    expect(updatedPage.sections[0].section_title).toBe('Section title');
    
    const actionLog = await Action.findOne({ action: 'create_section' });
    expect(actionLog.payload.section_title).toBe('Section title');
  });

});