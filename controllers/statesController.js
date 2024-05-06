const data = {
    states: require('../model/statesData.json')
}
const States = require('../model/States');

// GET FUNCTIONS

// Get All States Data
// Also handles contig query
const getAllStates = async (req, res) => {
    const { contig } = req.query;
    try {
        // Retrieve all state data from the JSON file
        const jsonStatesData = data.states;

        // Retrieve state data (including funfacts) from MongoDB collection
        const mongodbStatesData = await States.find();

        // Combine the data from both sources into a single array
        let combinedStatesData = [...jsonStatesData];

        // Handle contig=true query
        if (contig === 'true') {
            // Remove Alaska and Hawaii
            combinedStatesData = combinedStatesData.filter(state => state.code !== 'AK' && state.code !== 'HI');
        }

        // Handle contig=false query
        if (contig === 'false') {
            // Only Alaska and Hawaii
            combinedStatesData = combinedStatesData.filter(state => state.code === 'AK' || state.code === 'HI');
        }

        // Merge MongoDB data into the combined array
        mongodbStatesData.forEach(mongodbState => {
            const existingStateIndex = combinedStatesData.findIndex(state => state.code === mongodbState.stateCode);
            if (existingStateIndex !== -1 && Array.isArray(mongodbState.funfacts) && mongodbState.funfacts.length > 0) {
                combinedStatesData[existingStateIndex].funfacts = mongodbState.funfacts;
            }
        });

        // Send the combined data as a JSON response
        res.json(combinedStatesData);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
}

// Get One State
const getOneState = async (req, res) => {
    const { state } = req.params;
    try {
        // Retrieve all state data from the JSON file
        const jsonStatesData = data.states;

        // Retrieve state data (including funfacts) from MongoDB collection
        const mongodbStatesData = await States.find();

        // Combine the data from both sources into a single array
        let combinedStatesData = [...jsonStatesData];

        // Merge MongoDB data into the combined array
        mongodbStatesData.forEach(mongodbState => {
            const existingStateIndex = combinedStatesData.findIndex(st => st.code === mongodbState.stateCode);
            if (existingStateIndex !== -1 && Array.isArray(mongodbState.funfacts) && mongodbState.funfacts.length > 0) {
                combinedStatesData[existingStateIndex].funfacts = mongodbState.funfacts;
            }
        });

        // Remove other states
        const singleStateData = combinedStatesData.find(st => st.code === state.toUpperCase());

        // Send the combined data as a JSON response
        res.json(singleStateData);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
}

// Get Fun Fact
const getFunFact = async (req, res) => {
    const { state } = req.params;

    try {
        // Retrieve all states data from MongoDB collection
        let mongodbStatesData = await States.find();

        // Remove all states but state param state
        let stateForFunFact = mongodbStatesData.find(st => st.stateCode === state.toUpperCase());

        // Get state name from JSON data for no fun facts response
        const jsonStatesData = data.states;

        let jsonState = jsonStatesData.find(st => st.code === state.toUpperCase());

        const stateName = jsonState.state;

        // Check if state has funfacts
        if (!stateForFunFact.funfacts || !stateForFunFact.funfacts.length) {
            return res.status(404).json({ 
                message: `No Fun Facts found for ${stateName}`
            });
        }

        // Generate random funfact from array of funfacts
        let randomFunfact = stateForFunFact.funfacts[Math.floor(Math.random() * stateForFunFact.funfacts.length)];

        // turn response into object
        let resObj = {
            funfact: randomFunfact
        };

        // return object
        res.json(resObj);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
}

// Get State Capital
const getStateCapital = (req, res) => {
    const { state } = req.params;
    const stateData = data.states.find((st) => st.code === state.toUpperCase());
    res.json({
        'state': stateData.state,
        'capital': stateData.capital_city
    });
}

// Get State Nickname
const getStateNickname = (req, res) => {
    const { state } = req.params;
    const stateData = data.states.find((st) => st.code === state.toUpperCase());
    res.json({
        'state': stateData.state,
        'nickname': stateData.nickname
    });
}

// Get State Population
const getStatePopulation = (req, res) => {
    const { state } = req.params;
    const stateData = data.states.find((st) => st.code === state.toUpperCase());
    res.json({
        'state': stateData.state,
        'population': stateData.population.toLocaleString()
    });
}

// Get State Admission Date
const getStateAdmission = (req, res) => {
    const { state } = req.params;
    const stateData = data.states.find((st) => st.code === state.toUpperCase());
    res.json({
        'state': stateData.state,
        'admitted': stateData.admission_date
    });
}

// POST FUNCTION

const addFunFacts = async (req, res) => {
    const { state } = req.params;
    const { funfacts } = req.body;

    // Check if funfacts is an array
    if (!Array.isArray(funfacts)) {
        return res.status(400).json( {"message": "State fun facts value must be an array"} );
    }

    try {
        // find state in MongoDB collection corresponding to parameter
        let stateData = await States.findOne({ stateCode: state.toUpperCase() });

        // if state doesn't exist in collection, create a new one
        if (!stateData) {
            stateData = new States( {stateCode: state.toUpperCase(), funFacts: [] });
        }

        // add funfacts data to array
        stateData.funfacts.push(...funfacts);

        // save the document to the collection
        await stateData.save();

        // respond with updated document
        res.json(stateData);

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
}

// PATCH FUNCTION

// replace fun fact
const replaceFunFact = async (req, res) => {
    // check if index in body
    if (!req?.body?.index) {
        return res.status(400).json({ "message": "State fun fact index value required" });
    }

    // check if funfact in body
    if (!req?.body?.funfact) {
        return res.status(400).json({ "message": "State fun fact value required" });
    }

    // subtract 1 from index value
    const index = req.body.index - 1;

    // find state to update funfact
    const state = await States.findOne({ stateCode: req.params.state }).exec();

    // Get state name from JSON data for no index response
    const jsonStatesData = data.states;

    let jsonState = jsonStatesData.find(st => st.code === state.toUpperCase());

    const stateName = jsonState.state;

    // Check if funfact array exists. If so, check if the index exists. If not, return JSON saying they don't exist.
    if (Array.isArray(state.funfacts) && state.funfacts.length > 0) {
        // replace funfact in array
        if (typeof state.funfacts[index] !== 'undefined'){
            state.funfacts[index] = req.body.funfact;
        } else {
            return res.status(400).json({ "message": `No Fun Fact found at that index for ${stateName}` });
        }
    } else {
        return res.status(400).json({ "message": `No Fun Facts found for ${stateName}` });
    }
    // save and return response from mongodb
    const result = await state.save();

    res.json(result);
}

// DELETE FUNCTION 

// Delete funfact
const deleteFunFact = async (req, res) => {
    // check if index in body
    if (!req?.body?.index) {
        return res.status(400).json({ "message": "State fun fact index value required" });
    }

    // subtract 1 from index value
    const index = req.body.index - 1;

    try {
        // delete funfact from array in the database
        const result = await States.updateOne(
            { stateCode: req.params.state.toUpperCase() },
            { $pull: { funfacts: { $exists: true, $in: [null, ""] } } }
        );

        res.json(result);
    } catch (error) {
        console.error(error);
        res.status(500).json({ "message": "Internal server error" });
    }
}

module.exports = {
    getStateCapital,
    getStateNickname,
    getStatePopulation,
    getStateAdmission,
    addFunFacts, 
    getAllStates,
    getOneState, 
    getFunFact,
    replaceFunFact,
    deleteFunFact
}