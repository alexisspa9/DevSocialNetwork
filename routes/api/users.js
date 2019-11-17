const express = require('express');
const router = express.Router();
const { check, validationResult } = require('express-validator/check');
const User = require('../../models/User');
const jwt = require('jsonwebtoken');
const gravatar = require('gravatar');
const config = require('config');
const bcrypt = require('bcryptjs');


// @route   POST api/users
// @desc    Register user
// @access  Public
router.post('/', [
    check('name', 'Name is required').not().isEmpty(),
    check('email', 'Please include a valid email').isEmail(),
    check('password', 'Please enter a password with six or more characters').isLength({ min: 6 })
], async (req, res) => {
    const errors = validationResult(req);
    if(!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { name, email, password} = req.body;

    try {

        let user = await User.findOne({ email });


        if (user) {
            return res.status(400).json({ errors: [{ msg: 'User already exists'}]})
        }

        const avatar = gravatar.url(email, {
            s: '200',
            r: 'pg',
            d: 'mm'
        });

        user = new User({
            name,
            email,
            avatar,
            password
        });

        const salt = await bcrypt.genSalt(10);

        user.password = await bcrypt.hash(password, salt);


        await user.save();

        const payload = {
            user: {
                id: user.id
            }
        }
    
        jwt.sign(payload,  config.get("jwtToken"), { expiresIn: 360000 }, (err, token) => {
            if (err) throw err;
            return res.json({ token });
        } );
    } catch (error) {
        console.log(error.message);
        res.status(500).send('Server error');
    }
});



module.exports = router;