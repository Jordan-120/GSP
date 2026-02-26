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

describe('Function CRUD API, nested in Page schema', () => {
  let templateId;
  let pageId;
  let sectionId

  beforeEach(async () => {
    const template = await Template.create({
      template_name: 'Landing Template',
      version: 1,
      publish_status: 'Draft'
    });
    templateId = template._id;

    const page = await Page.create({
      page_name: 'Landing Page',
      template: templateId,
      sections: [{section_title: 'Landing Section', section_number: 1}]
    });
    pageId = page._id;
    sectionId = page.sections[0]._id;
    });

  afterEach(async () => {
    await Template.deleteMany({});
    await Page.deleteMany({});
    await Action.deleteMany({});
  });
  it('POST /api/pages/:pageId/sections/:sectionId/functions creates a function and logs action', async () => {
    const res = await request(app)
        .post(`/api/pages/${pageId}/sections/${sectionId}/functions`)
        .send({ function_name: 'Function title'});
    expect(res.statusCode).toBe(201);
    expect(res.body.function_name).toBe('Function title');
    
    const updatedPage = await Page.findById(pageId);
    expect(updatedPage.sections[0].functions[0].function_name).toBe('Function title');
    
    const actionLog = await Action.findOne({ action: 'create_function' });
    expect(actionLog.payload.function_name).toBe('Function title');
  });

});