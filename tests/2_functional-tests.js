/*
*
*
*       FILL IN EACH FUNCTIONAL TEST BELOW COMPLETELY
*       -----[Keep the tests in the same order!]-----
*       (if additional are added, keep them at the very end!)
*/

const chaiHttp = require('chai-http'),
      chai = require('chai'),
      assert = chai.assert,
      server = require('../server');

//vars for testing
let id1, //_id of thread 1 created
    id2, //_id of thread 2 created
    id3; //_id of reply created

chai.use(chaiHttp);

suite('Functional Tests', function() {

  suite('API ROUTING FOR /api/threads/:board', function() {
    
    suite('POST', function() {
      test('Create thread', (done) => {
        chai.request(server)
          .post('/api/threads/fcc')
          .send({text: 'Test thread', delete_password: 'test'})
          .end( (err, res) => {
            assert.equal(res.status, 200);
            done();
          });
      });
      test('Create thread for future deletion test', (done) => {
        chai.request(server)
          .post('/api/threads/fcc')
          .send({text: 'Test thread 2', delete_password: 'test'})
          .end( (err, res) => {
            assert.equal(res.status, 200);
            done();
          });
      });
    });
    
    suite('GET', function() {
      test('Get last 10 threads with 3 replies each', (done) => {
        chai.request(server)
          .get('/api/threads/fcc')
          .end( (err, res) => {
            assert.equal(res.status, 200);
            assert.isArray(res.body);
            assert.isBelow(res.body.length, 11);
            assert.isArray(res.body[0].replies);
            assert.isBelow(res.body[0].replies.length, 4);
            assert.property(res.body[0], '_id');
            assert.property(res.body[0], 'text');
            assert.property(res.body[0], 'replies');
            assert.property(res.body[0], 'created_on');
            assert.property(res.body[0], 'bumped_on');
            assert.notProperty(res.body[0], 'reported');
            assert.notProperty(res.body[0], 'delete_password');
            id1 = res.body[0]._id;
            id2 = res.body[1]._id;
            done();
          });
      });
    });
    
    suite('PUT', function() {
      test('Report thread', (done) => {
        chai.request(server)
          .put('/api/threads/fcc')
          .send({report_id: id2})
          .end( (err, res) => {
            assert.equal(res.status, 200);
            assert.equal(res.text, 'Reported');
            done();
          });
      });
    });
    
    suite('DELETE', function() {
      test('Delete thread with correct pswd', (done) => {
        chai.request(server)
          .delete('/api/threads/fcc')
          .send({thread_id: id1, delete_password: 'test'})
          .end( (err, res) => {
            assert.equal(res.status, 200);
            assert.equal(res.text, 'Success');
            done();
          });
      });
      test('Delete thread with wrong pswd', (done) => {
        chai.request(server)
          .delete('/api/threads/fcc')
          .send({thread_id: id2, delete_password: 'abc'})
          .end( (err, res) => {
            assert.equal(res.status, 200);
            assert.equal(res.text, 'Incorrect password');
            done();
          });
      });
    });

  });
  
  suite('API ROUTING FOR /api/replies/:board', function() {
    
    suite('POST', function() {
      test('Reply to thread', (done) => {
        chai.request(server)
          .post('/api/replies/fcc')
          .send({thread_id: id2, text: 'Test reply', delete_password: 'test'})
          .end( (err, res) => {
            assert.equal(res.status, 200);
            done();
          });
      });
    });
    
    suite('GET', function() {
      test('Get all replies to thread', (done) => {
        chai.request(server)
          .get('/api/replies/fcc')
          .query({thread_id: id2})
          .end( (err, res) => {
            assert.equal(res.status, 200);
            assert.isArray(res.body.replies);
            assert.property(res.body, '_id');
            assert.property(res.body, 'text');
            assert.property(res.body, 'replies');
            assert.property(res.body, 'created_on');
            assert.property(res.body, 'bumped_on');
            assert.notProperty(res.body, 'reported');
            assert.notProperty(res.body, 'delete_password');
            assert.equal(res.body.replies[0].text, 'Test reply');
            id3 = res.body.replies[0]._id;
            done();
          });
      });
    });
    
    suite('PUT', function() {
      test('Report reply', (done) => {
        chai.request(server)
          .put('/api/threads/fcc')
          .send({thread_id: id2, reply_id: id2})
          .end( (err, res) => {
            assert.equal(res.status, 200);
            assert.equal(res.text, 'Reported');
            done();
          });
      });
    });
    
    suite('DELETE', function() {
      test('Delete reply with wrong pswd', (done) => {
        chai.request(server)
          .delete('/api/replies/fcc')
          .send({thread_id: id2, reply_id: id3, delete_password: 'abc'})
          .end( (err, res) => {
            assert.equal(res.status, 200);
            assert.equal(res.text, 'Incorrect password');
            done();
          });
      });
      test('Delete reply with correct pswd', (done) => {
        chai.request(server)
          .delete('/api/replies/fcc')
          .send({thread_id: id2, reply_id: id3, delete_password: 'test'})
          .end( (err, res) => {
            assert.equal(res.status, 200);
            assert.equal(res.text, 'Success');
            done();
          });
      });
    });
    
  });

});
