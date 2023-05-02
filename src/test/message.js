require('dotenv').config()
const app = require('../server.js')
const mongoose = require('mongoose')
const chai = require('chai')
const chaiHttp = require('chai-http')
const assert = chai.assert

const User = require('../models/user.js')
const Message = require('../models/message.js')

chai.config.includeStack = true

const expect = chai.expect
const should = chai.should()
chai.use(chaiHttp)

/**
 * root level hooks
 */
after((done) => {
  // required because https://github.com/Automattic/mongoose/issues/1251#issuecomment-65793092
  mongoose.models = {}
  mongoose.modelSchemas = {}
  mongoose.connection.close()
  done()
})

const USER_OBJECT_ID = '616161616161616161616161'
const MESSAGE_OBJECT_ID_1 = '626262626262626262626262'
const MESSAGE_OBJECT_ID_2 = '636363636363636363636363' 

describe('Message API endpoints', () => {
    beforeEach(async () => {
        // Create a sample user
        const sampleUser = new User({
            username: 'myuser',
            password: 'mypassword',
            _id: USER_OBJECT_ID
        })
        await sampleUser.save()
        
        // Create a sample messages
        const firstMessage = new Message({
            title: 'first title',
            body: 'first body',
            author: sampleUser,
            _id: MESSAGE_OBJECT_ID_1
        })
        await firstMessage.save()

        const message = await Message.findOne({_id: MESSAGE_OBJECT_ID_1})
        const user = await User.findOne({username: "myuser"})
        user.messages.unshift(message)
        await user.save()
    })

    afterEach(async () => {
        // TODO: add any afterEach code here
        // Create the sample users and sample messages
        await User.deleteMany({ username: ["myuser"] })
        await Message.deleteMany({ title: ["first title", "second title", "newtitle"] })
        // await Message.deleteMany({})
    })

    it('should load all messages', (done) => {
        // TODO: Complete this
        chai.request(app) 
        .get('/messages')
        .end((err, res) => {
            if (err) { done(err) }
            expect(res).to.have.status(200)
            expect(res.body.messages).to.be.an("array")
            expect(res.body.messages.length).to.equal(1)
            expect(res.body.messages[0].title).to.deep.equal("first title")
            expect(res.body.messages[0].body).to.deep.equal("first body")
            expect(res.body.messages[0].author).to.deep.equal("616161616161616161616161")
            done()
        })
    })

    it('should get one specific message', (done) => {
        // TODO: Complete this
        chai.request(app)
        .get(`/messages/${MESSAGE_OBJECT_ID_1}`)
        .end((err, res) => {
            if (err) { done(err) }
            expect(res).to.have.status(200)
            expect(res.body).to.be.an("object")
            expect(res.body.title).to.deep.equal("first title")
            expect(res.body.body).to.deep.equal("first body")
            expect(res.body.author).to.deep.equal("616161616161616161616161")
            done()
        })
    })

    it('should post a new message', (done) => {
        // TODO: Complete this
        User.findOne({ username: "myuser" }).then((user) => {
            const newMessage = {
                title: "second title",
                body: "second body",
                author: user._id,
            }
            chai.request(app)
            .post(`/messages`)
            .send(newMessage)
            .end((err, res) => {
                if (err) { done(err) }
                expect(res.body.message).to.be.an("object")
                expect(res.body.message).to.have.property('title', 'second title')
                expect(res.body.message).to.have.property('author', '616161616161616161616161')
                done()
            })
        })
    })

    it('should update a message', (done) => {
        // TODO: Complete this
        chai.request(app)
        .put(`/messages/${MESSAGE_OBJECT_ID_1}`)
        .send({title: "newtitle", body: "newbody"})
        .end((err, res) => {
            if (err) { done(err) }
            expect(res.body.message).to.be.an("object")
            expect(res.body.message).to.have.property("title", "newtitle")
            expect(res.body.message).to.have.property("body", "newbody")

            Message.findOne({title: "newtitle"}).then(message => {
                expect(message).to.be.an("object")
                done()
            })
        })
    })

    it('should delete a message', (done) => {
        // TODO: Complete this
        chai.request(app)
        .delete(`/messages/${MESSAGE_OBJECT_ID_1}`)
        .end((err, res) => {
            if (err) { done(err) }
            expect(res.body.message).to.equal("Successfully deleted.")
            expect(res.body._id).to.equal(MESSAGE_OBJECT_ID_1)
            User.findOne({ username: "myuser"}).then((user) => {
                expect(user).to.have.property('username', 'myuser')
                expect(user.messages).to.be.empty
            }).then(() => { 
                Message.findOne({title: "first title"}).then(message => {
                    expect(message).to.equal(null)
                }).then(() => {
                    done()
                })
            })
        })
    })
})
