const express = require('express');
const router = express.Router();
const statesController = require('../../controllers/statesController');
const verifyStates = require('../../middleware/verifyStates');

router.route('/')
    .get(statesController.getAllStates);

router.route('/:state')
    .get(verifyStates, statesController.getOneState);

router.route('/:state/funfact')
    .get(verifyStates, statesController.getFunFact)
    .patch(verifyStates, statesController.replaceFunFact)
    .delete(verifyStates, statesController.deleteFunFact);

router.route('/:state/capital')
    .get(verifyStates, statesController.getStateCapital);

router.route('/:state/nickname')
    .get(verifyStates, statesController.getStateNickname);

router.route('/:state/population')
    .get(verifyStates, statesController.getStatePopulation);

router.route('/:state/admission')
    .get(verifyStates, statesController.getStateAdmission);

router.route('/:state/funfact')
    .post(verifyStates, statesController.addFunFacts);

module.exports = router;