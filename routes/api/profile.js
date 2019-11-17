const express = require('express');
const router = express.Router();
const auth = require('../../middleware/auth');
const Profile = require('../../models/Profile');
const User = require('../../models/User');
const { check, validationResult } = require('express-validator');


// @route   GET api/profile/me
// @desc    Get current users Profile
// @access  Private
router.get('/me', auth, async (req, res) => {

        try {
        const profile = await Profile.findOne({ user: req.user.id} ).populate('user', ['name', 'avatar']) ;
        
        if(!profile) {
            return res.status(400).json({ msg: 'There is no profile for this user'})
        }
        
        return res.json(profile);

        } catch (error) {
            console.error(error.message);
            res.status(500).json('Server error');
        }

    }
);


// @route   Post api/profile
// @desc    Create or Update users Profile
// @access  Private
router.post('/', [auth, [
    check('status', 'Status is required').not().isEmpty(),
    check('skills', 'Skills is required').not().isEmpty()
]], async (req, res) => {

    const errors  = validationResult(req);

    if (!errors.isEmpty()) {
       return res.status(400).json({ errors: errors.array()});
    }

    const {
        company,
        website,
        location,
        bio,
        status,
        githubusername,
        skills,
        youtube,
        facebook,
        twitter,
        instagram,
        linkedin
    } = req.body;

    const profileFields = {};

    profileFields.user = req.user.id;

    if (company) profileFields.company = company;
    if (website) profileFields.website = website;
    if (location) profileFields.location = location;
    if (bio) profileFields.bio = bio;
    if (status) profileFields.status = status;
    if (githubusername) profileFields.githubusername = githubusername;
    if (skills) profileFields.skills = skills.split(",").map(skill => skill.trim());

    profileFields.social = {};
    if (youtube) profileFields.social.youtube = youtube;
    if (facebook) profileFields.social.facebook = facebook;
    if (twitter) profileFields.social.twitter = twitter;
    if (instagram) profileFields.social.instagram = instagram;
    if (linkedin) profileFields.social.linkedin = linkedin;



    try {
        let profile = await Profile.findOne({ user: req.user.id });

        if(profile) {
            profile = await Profile.findOneAndUpdate({ user: req.user.id}, { $set: profileFields}, { new: true});

            return res.json(profile);
        }

        profile = new Profile(profileFields);

        await profile.save();
        
        return res.json(profile);
        
    } catch (error) {
        console.error(error.message);
        return res.status(500).json({ msg: 'Server error' });
    }

});


// @route    GET api/profile
// @desc     Get all profiles
// @access   Public

router.get('/', async (req, res) => {
    try {
        const profiles = await Profile.find().populate('user', ['name', 'avatar']);

        res.json(profiles);
    } catch (error) {
        console.error(error.message);
        res.status(500).send('Server error');
    }
});


// @route    GET api/profile/users/:user_id
// @desc     Get Profile by user id
// @access   Public

router.get('/users/:user_id', async (req, res) => {
    try {
        const profile = await Profile.findOne({ user: req.params.user_id }).populate('user', ['name', 'avatar']);
        if(!profile) return res.status(400).json({ msg: "Profile not found"});
        res.json(profile);
    } catch (error) {
        console.error(error.message);
        if(error.kind == "ObjectId") {
            return res.status(400).json({ msg: "Profile not found" });
        }
        res.status(500).send('Server error');
    }
});


// @route    DELETE api/profile
// @desc     Delete profile, user & posts
// @access   Private

router.delete('/', auth, async (req, res) => {
    try {
        // @todo remove posts

        // remove Profile
        await Profile.findOneAndRemove({ user: req.user.id});

        // remove User

        await User.findOneAndRemove({ _id: req.user.id });

        res.json({ msg: 'User deleted!'});
    } catch (error) {
        console.error(error.message);
        res.status(500).send('Server error');
    }
});


module.exports = router;