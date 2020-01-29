const express = require('express')
const Task = require('../models/task')
const auth = require('../middleware/auth')
const router = new express.Router()

router.post('/tasks', auth, async (req, res) => {
    const task = new Task({
        ...req.body,
        author: req.user._id
    })

    try {
        await task.save()
        res.status(201).send(task)
    } catch (e) {
        console.log(e)
        res.status(400).send()
    }
})

//GET /tasks?completed=true
//GET /tasks?limit=10&skip=0
//GET /tasks?sortBy=createdAd_asc || _desc
router.get('/tasks', auth, async (req, res) => {
    const match = {}
    let sortMethod

    if (req.query.completed) {
        match.completed = req.query.completed === 'true' 
    }

    if (req.query.sortBy) {
        sortMethod = (req.query.sortBy.split('_')[1] === 'desc') ? -1 : 1
    }
    
    try {
        await req.user.populate({
            path: 'tasks',
            match,
            options: {
                limit: parseInt(req.query.limit),
                skip: parseInt(req.query.skip),
                sort: {
                    createdAt: sortMethod
                }
            }
        }).execPopulate()
        res.send(req.user.tasks)
    } catch (e) {
        res.status(500).send()
    }
})

router.get('/tasks/:id', auth, async (req, res) => {
    const _id = req.params.id

    try {
        const task = await Task.findOne({ _id, author: req.user._id })
        if (!task) return res.status(404).send()
        res.send(task)    
    } catch (e) {
        res.status(500).send()
    }
})

router.patch('/tasks/:id', auth, async (req, res) => {
    const allowedUpdates = ['description', 'completed']
    const updates = Object.keys(req.body)
    const updatesBool = updates.every((update) => {
        return allowedUpdates.includes(update)
    })
    
    if (!updatesBool) return res.status(400).send({error: 'Invalid updates'})

    try {
        const task = await Task.findOne({ _id: req.params.id, author: req.user._id })
        if (!task) return res.status(404).send()
        updates.forEach((update) => {
            task[update] = req.body[update]
        })
        await task.save()

        //const task = await Task.findByIdAndUpdate(req.params.id, req.body, { runValidators: true, new: true })
        res.send(task)
    } catch (e) {
        res.status(400).send()
    }
})

router.delete('/tasks/:id', auth, async (req, res) => {
    try {
        const task = await Task.findOneAndDelete({ _id: req.params.id, author: req.user._id })
        if (!task) return res.status(404).send()
        res.send(task)
    } catch (e) {
        res.status(500).send()
    }
})

module.exports = router