//OUTDATED- Origonal plan, but we found better way to storing data (single point entry for Mongo)

const express = require('express');

const { createPage, getAllPages, getPageById, updatePage, deletePage, createSectionToPage, updateSectionInPage, 
    getAllSectionsInPage, getSectionInPageById, deleteSectionFromPage, createFunctionToSection, 
    updateFunctionInSection, getAllFunctionsInSection, getFunctionInSectionById, deleteFunctionInSection, 
    createDataEntryToSection, updateDataEntryInSection, getAllDataEntriesInSection, getDataEntryInSectionById, 
    deleteDataEntryInSection} = require('../controllers/pageController');

const router = express.Router();

//Post create a new page
router.post('/', createPage);

//Get retrieve all pages
router.get('/', getAllPages);

//Get retrieve a page by ID
router.get('/:id', getPageById);

//Put update a page by ID
router.put('/:id', updatePage);

//Delete a page by ID 
router.delete('/:id', deletePage);

//Create a section to a page, requires pageId
router.post('/:pageId/sections', createSectionToPage);

//Update a section in a page, requires pageid and sectionId
router.put('/:pageId/sections/:sectionId', updateSectionInPage);

//get all sections in a page, requires pageId
router.get('/:pageId/sections', getAllSectionsInPage);

//geet a section in a page by Id, requires pageId
router.get('/:pageId/sections/:sectionId', getSectionInPageById);

//Delete a section in a page, requires pageId and sectionId
router.delete('/:pageId/sections/:sectionId', deleteSectionFromPage);

//Create a function in a section, requires pageId, and sectionId
router.post('/:pageId/sections/:sectionId/functions', createFunctionToSection);

//Update a function in a section, requires pageId, sectionId, and functionId
router.put('/:pageId/sections/:sectionId/functions/:functionId', updateFunctionInSection);

//Get all functions in a section, requires pageId, and sectionId
router.get('/:pageId/sections/:sectionId/functions', getAllFunctionsInSection);

//Get a function in a section, requires pageId, sectionId, and functionId
router.get('/:pageId/sections/:sectionId/functions/:functionId', getFunctionInSectionById);

//Delete a function in a section, requires pageId, sectionId and functionId
router.delete('/:pageId/sections/:sectionId/functions/:functionId', deleteFunctionInSection);
 
//Create a Data Entry in a section, requires pageId, and sectionId
router.post('/:pageId/sections/:sectionId/data_entries', createDataEntryToSection);

//Update a Data Entry in a section, requires pageId, sectionId, and entryid
router.put('/:pageId/sections/:sectionId/data_entries/:entryId', updateDataEntryInSection);

//Get all Data Entries in a section, requires pageId, sectionId, and entryid
router.get('/:pageId/sections/:sectionId/data_entries', getAllDataEntriesInSection);

//Get a Data Entry in a section, requires pageId, sectionId, and entryid
router.get('/:pageId/sections/:sectionId/data_entries/:entryId', getDataEntryInSectionById);

//Delete a Data Entry in a section, requires pageId, sectionId, and entryid
router.delete('/:pageId/sections/:sectionId/data_entries/:entryId', deleteDataEntryInSection);

//console.log("templateRoutes loaded");//Testing that routes are loaded

module.exports = router;