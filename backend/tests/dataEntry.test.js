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

describe('DataEntry CRUD API, nested in Section schema', () => {
  let templateId;
  let pageId;
  let sectionId;

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
      sections: [{ section_title: 'Hero Section', section_number: 1 }]
    });
    pageId = page._id;
    sectionId = page.sections[0]._id;
  });

  afterEach(async () => {
    await Template.deleteMany({});
    await Page.deleteMany({});
    await Action.deleteMany({});
  });

  it('POST /api/pages/:pageId/sections/:sectionId/data_entries creates a data entry and logs action', async () => {
    const res = await request(app)
      .post(`/api/pages/${pageId}/sections/${sectionId}/data_entries`)
      .send({ entry_title: 'Headline', content_text: 'Welcome to our site!' });

    // 
    expect(res.statusCode).toBe(201);
    expect(res.body.entry_title).toBe('Headline');

    // 
    const updatedPage = await Page.findById(pageId);
    expect(updatedPage.sections[0].data_entries[0].entry_title).toBe('Headline');
    expect(updatedPage.sections[0].data_entries[0].content_text).toBe('Welcome to our site!');

    //logging action
    const actionLog = await Action.findOne({ action: 'create_entry' });
    expect(actionLog.payload.entry_title).toBe('Headline');
  });
});