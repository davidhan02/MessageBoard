/*
*
*
*       Complete the API routing below
*
*
*/

'use strict';

const expect       = require('chai').expect,
      MongoClient  = require('mongodb'),
      ObjectId     = require('mongodb').ObjectID,
      mongoose     = require('mongoose'),
      url          = process.env.DB; 

module.exports = function (app) {
  
  //Threads Route Handling
  app.route('/api/threads/:board')
  
    //Get thread list
    .get( (req, res) => {
      //Assign board from url to var
      let board = req.params.board;
      MongoClient.connect( url, (err, db) => {
        let collection = db.collection(board);
        collection.find(
          {},
          {
            reported: 0,
            delete_password: 0,
            "replies.delete_password": 0,
            "replies.reported": 0,
          })
          //reverse sort by Date
          .sort({bumped_on: -1})
          //limit to 10 threads
          .limit(10)
          .toArray( (err, array) => {
            array.forEach((item) => {
              //Set replycount property
              item.replycount = item.replies.length;
              //Limit replies length to 3
              if (item.replies.length > 3) {
                item.replies = item.replies.splice(-3);
              }
            });
            res.json(array);
          });
      });
    })
  
    //Post new thread
    .post( (req, res) => {
      let board = req.params.board;
      //Template for new object
      let thread = {
        text: req.body.text,
        created_on: new Date(),
        bumped_on: new Date(),
        reported: false,
        replies: [],
        delete_password: req.body.delete_password
      };
      MongoClient.connect( url, (err, db) => {
        if (err) res.send(err);
        let collection = db.collection(board);
        //Insert acts same as saving to db
        collection.insert(thread, () => {
          //Redirect after insertion
          res.redirect('/b/'+board+'/');
        });
      });
    })
  
    //Report a thread
    .put( (req, res) => {
      let board = req.params.board,
          id = new ObjectId(req.body.report_id);
      MongoClient.connect( url, (err, db) => {
        if (err) res.send(err);
        let collection = db.collection(board);
        collection.findAndModify(
          {_id: id}, 
          [],
          {$set: {reported: true}},
          (err, result) => {
            if (err) res.send(err);
          });
      });
      res.send('Reported');
    })
    
    //Delete a thread
    .delete( (req, res) => {
      let board = req.params.board,
          id = new ObjectId(req.body.thread_id);
      MongoClient.connect( url, (err, db) => {
        if (err) res.send(err);
        let collection = db.collection(board);
        //Use find and modify because of password
        collection.findAndModify(
          {_id: id, 
           delete_password: req.body.delete_password},
          [],
          {},
          {remove: true, new: false},
          (err, result) => {
            if (err) {
              res.send(err);
            } else if (result.value === null) {
              res.send('Incorrect password');
            } else {
              res.send('Success');
            }
          });
      });
    });
    
  
  //Reply route handling
  app.route('/api/replies/:board')
  
    //Get reply list
    .get( (req, res) => {
      let board = req.params.board;
      let id = new ObjectId(req.query.thread_id);
      //Connect to DB
      MongoClient.connect( url, (err, db) => {
        let collection = db.collection(board);
        //use .find and .toArray for result
        collection.find(
          {_id: id},
          {
            reported: 0,
            delete_password: 0,
            "replies.delete_password": 0,
            "replies.reported": 0,
          })
          .toArray( (err, result) => {
            if (err) {
              res.send(err);
            } else {
              res.json(result[0]);
            }
          });
      });
    })
  
    //Post a reply
    .post( (req, res) => {
      let board = req.params.board;
      //Format for new reply to thread object in DB
      let reply = {
        _id: new ObjectId(),
        text: req.body.text,
        created_on: new Date(),
        reported: false,
        delete_password: req.body.delete_password
      };
      MongoClient.connect( url, (err, db) => {
        if (err) res.send(err);
        let collection = db.collection(board);
        let id = new ObjectId(req.body.thread_id);
        //Adding replies to array in thread object in DB
        collection.findAndModify(
          {_id: id},
          [], //No sort
          { //Changes here
            $set: {bumped_on: new Date()},
            $push: {replies: reply}
          },
          (err, result) => {});
      });
      //Redirect to thread page to see replies
      res.redirect('/b/' + board + '/' + req.body.thread_id);
    })
  
    //Report a reply
    .put( (req, res) => {
      let board = req.params.board,
          id = new ObjectId(req.body.thread_id),
          rep_id = new ObjectId(req.body.reply_id);
      MongoClient.connect( url, (err, db) => {
        let collection = db.collection(board);
        collection.findAndModify(
          {_id: id,
          "replies._id": rep_id},
          [], //No sort
          {$set: {"replies.$.reported": true}},
          (err, result) => {
            if (err) res.send(err);
          });
      });
    })
    
    //Delete a reply
    .delete( (req, res) => {
      let board = req.params.board,
          id = new ObjectId(req.body.thread_id),
          rep_id = new ObjectId(req.body.reply_id);
      //Connect to DB
      MongoClient.connect( url, (err, db) => {
        let collection = db.collection(board);
        collection.findAndModify(
          {
            _id: id,
            replies: {$elemMatch: {_id: rep_id, delete_password: req.body.delete_password}}
          },
          [], //No sort
          {$set: {"replies.$.text": "[deleted]"}},
          (err, result) => {
            if (err) {
              res.send(err);
            } else if (result.value === null) {
              res.send('Incorrect password');
            } else {
              res.send('Success');
            }
          });
      });
    });

};
