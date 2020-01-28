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

router.get('/tasks', auth, async (req, res) => {
    try {
        //const tasks = await Task.find({ author: req.user._id })
        await req.user.populate('tasks').execPopulate()
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