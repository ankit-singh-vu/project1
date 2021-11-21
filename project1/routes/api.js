const express = require('express');
const router = express.Router();
const { apiAuth } = require('../config/authentication');
const indexCon = require('../controller/apiController/indexCon');

var request = require('request');


router.post('/user-signup', indexCon.userRegistration);
router.post('/login', indexCon.userLogin);
router.get('/get-user-info/:userId', indexCon.getUserInfo);
router.patch('/edit-profile', apiAuth, indexCon.editProfile);

router.post('/add-category', apiAuth, indexCon.addCategory);
router.get('/category-list',  indexCon.getCategoryList);
router.get("/get-questions/:Category_id",  indexCon.getQuestions);
router.post("/add-question",  indexCon.addQuestion);
router.post("/add-questions-csv",  indexCon.addQuestioncsv);





router.get('*', async (req, res) => {
    res.status(404).json({ status: 'error', message: 'Sorry! API your are looking for has not been found'});
});
router.post('*', async (req, res) => {
    res.status(404).json({ status: 'error', message: 'Sorry! API your are looking for has not been found'});
});

module.exports = router;