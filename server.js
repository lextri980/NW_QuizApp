const express = require('express');
const app = express();
const { MongoClient, ObjectId } = require('mongodb');
const PORT = 3000

//middleware
app.use(express.static('public'));
app.use(express.urlencoded());
app.use(express.json());

const DBS_NAME = 'wpr-quiz';
const DBS_URL = `mongodb://localhost:27017/${DBS_NAME}`;
let dbs = null
let attempts = null
let questions = null
async function connectDB() {
  try {
    const client = await MongoClient.connect(DBS_URL);
    dbs = client.db();
    attempts = dbs.collection("attempts");
    questions = dbs.collection("questions");
    console.log('MongoDB connected!');
  } catch (error) {
    console.log('Fail to connect!');
  }
}
connectDB();

app.post('/attempts', async (req, res) => {
  try {
    const questionList = await questions.aggregate([{ $sample: { size: 10 } }]).toArray();
    const correctAnswers = {};
    const startAt = Date();
    for (const question of questionList) {
      correctAnswers[question._id] = question.correctAnswer;
      delete question.correctAnswer;
    }
    await attempts.insertOne({
      questions: questionList,
      correctAnswers: correctAnswers,
      startAt: startAt,
      completed: false,
    });
    const finalAttempt = await attempts.find().sort({ '_id': -1 }).toArray();
    const submitObject = {
      _id: finalAttempt[0]._id,
      questions: questionList,
      startAt: startAt,
      score: 0,
      completed: false,
    };
    res.status(200).json(submitObject);
  } catch (error) {
    console.log(error);
  }
});

app.get('/attempts/:id', async (req, res) => {
  try {
    const attemptID = req.params.id;
    await attempts.findOne({ _id: ObjectId(attemptID) },
      function (err, attempt) {
        const questionList = attempt.questions;
        for (const question of questionList) {
          delete question.correctAnswer;
        }
        submitObject = {
          _id: attempt._id,
          questions: questionList,
          answers: attempt.answers,
          startAt: attempt.startAt,
          score: 0,
          completed: true,
        };
        res.status(200).json(submitObject);
      });
  } catch (error) {
    console.log(error);
  }
});

app.post('/attempts/:id', async (req, res) => {
  try {
    const attemptID = req.params.id;
    const checkedAnswer = req.body.answers;
    await attempts.updateOne(
      { _id: ObjectId(attemptID) },
      { $set: { answers: checkedAnswer } }
    );
  } catch (error) {
    console.log(error);
  }
});


app.post('/attempts/:id/submit', async (req, res) => {
  try {
    const checkedAnswer = req.body.answers;
    const attemptID = req.params.id;
    let submitObject = {};
    let scoreNumber = 0;
    let scoreComment = "";
    let startAt = 0;
    await attempts.findOne({ _id: ObjectId(attemptID) }, 
    function (err, attempt) {
      startAt = attempt.startAt;
      for (chosenAnswer in checkedAnswer) {
        if (attempt.correctAnswers[chosenAnswer] == checkedAnswer[chosenAnswer]) {
          scoreNumber++;
        }
      }
      switch (true) {
        case (scoreNumber < 5):
          scoreComment = "Practice more to improve it :D";
          break;
        case (scoreNumber >= 5 && scoreNumber < 7):
          scoreComment = "Good, keep up!";
          break;
        case (scoreNumber >= 7 && scoreNumber < 9):
          scoreComment = "Well done!";
          break;
        case (scoreNumber >= 9 && scoreNumber <= 10):
          scoreComment = "Perfect!!";
          break;
        default:
          scoreComment = "undefiend";
          break;
      }
      submitObject = {
        _id: attempt._id,
        questions: attempt.questions,
        answers: checkedAnswer,
        correctAnswers: attempt.correctAnswers,
        score: scoreNumber,
        scoreText: scoreComment,
        startAt: startAt,
        completed: true, 
      };
      res.status(200).json(submitObject);
    });
  } catch (error) {
    console.log(error);
  }
});

app.listen(PORT, () => {
  console.log(`Example app listening at http://localhost:${PORT}`)
})



