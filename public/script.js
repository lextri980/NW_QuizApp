document.querySelector('#start-btn').addEventListener('click', displayQuestion);
document.querySelector('#try').addEventListener('click', tryAgain);


function displayQuestion() {
    document.querySelector('#introduction').style.display = 'none';
    document.querySelector('#questions').style.display = 'block';
    document.querySelector('#submit').style.display = 'block';
    fetchData()
}

function clickAnswer(e) {
    const clickedAnswer = e.currentTarget;
    const parentEle = clickedAnswer.parentElement;
    const clickedAnswerLabel = parentEle.querySelector('.clicked');
    if (clickedAnswerLabel != null) {
        clickedAnswerLabel.classList.remove('clicked');
    }
    clickedAnswer.classList.add('clicked');
}

let id;
var response;

async function fetchData() {
    await fetch('http://localhost:3000/attempts', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },

    }).then((response) => {
        response.json().then((data) => {
            id = data._id;
            // get questions
            let questions = data.questions;
            questions.forEach((item, index) => {
                const questionList = document.querySelector('#questions');

                const order = document.createElement('h2');
                order.textContent = 'Question ' + (index + 1) + ' of 10';
                const q = document.createElement('p');
                q.textContent = item.text;
                questionList.appendChild(order);
                questionList.appendChild(q);
                const divAnswer = document.createElement('div');
                divAnswer.id = item._id;
                questionList.appendChild(divAnswer);
                let valueAns = 0;
                // get answers
                for (ans of item.answers) {
                    const labelAnswer = document.createElement('label');
                    labelAnswer.addEventListener('click', clickAnswer);
                    const answerContent = document.createElement('span');
                    answerContent.textContent = ' ' + ans;
                    labelAnswer.classList.add('chosen');
                    const radio = document.createElement('input');
                    radio.type = 'radio';
                    radio.value = valueAns;
                    radio.id = 'radio-id-' + valueAns;
                    radio.name = 'question' + (index + 1);
                    labelAnswer.appendChild(radio);
                    labelAnswer.appendChild(answerContent);
                    divAnswer.appendChild(labelAnswer);
                    valueAns++;
                }
            });
        })
    }).catch((err) => {
        console.log(err)
    });
}



async function check() {
    let selector = document.querySelectorAll('input:checked');
    console.log(selector);
    if (selector) {
        response = '{ "answers": {';

        if (selector) {
            for (let i = 0; i < selector.length; i++) {
                if (i == (selector.length - 1)) {
                    response += '"' + selector[i].parentElement.parentElement.getAttribute('id') + '"' + ':' + selector[i].value + '}}';
                    break;
                }
                response += '"' + selector[i].parentElement.parentElement.getAttribute('id') + '"' + ':' + selector[i].value + ',';

            }
        }

    } else {
        var response = '{ "answers": {}}';
    }

    // get correct answers
    await fetch('http://localhost:3000/attempts/' + String(id) + '/submit', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: response

    }).then((response) => {
        response.json().then((data) => {

            document.querySelector('#score').textContent = data.score + '/10';
            document.querySelector('#score-percent').textContent = data.score * 10 + ' %';
            document.querySelector('#score-text').textContent = data.scoreText;



            for (const queId in data.correctAnswers) {
                const que = document.getElementById(queId);
                const radioCorrectAns = que.querySelector('#radio-id-' + data.correctAnswers[queId]);
                const correctAns = document.createElement('span');
                correctAns.textContent = 'Correct answer';
                correctAns.id = 'correct-answer';
                radioCorrectAns.parentElement.appendChild(correctAns);
                radioCorrectAns.parentElement.classList.add('miss-correct-answer');
            }


            for (let i = 0; i < selector.length; i++) {
                if (selector[i].parentElement.querySelector('#correct-answer') == null) {
                    const yourAns = document.createElement('span');
                    yourAns.textContent = 'Your answer';
                    yourAns.id = 'your-answer';
                    selector[i].parentElement.appendChild(yourAns);
                    selector[i].parentElement.classList.add('wrong');
                } 
                else {
                    selector[i].parentElement.classList.add('correct')
                }
            }
        })
        
    }).catch((err) => {
        console.log(`Error: ${err}`)
    });
    const listRadio = document.querySelectorAll('input');
    for (radio of listRadio) {
        radio.disabled = true;
    }
    const listLabel = document.querySelectorAll('label');
    for (label of listLabel) {
        label.removeEventListener('click', clickAnswer);
    }
    const submit = document.querySelector('#submit');
    submit.style.display = "none";
    const result = document.querySelector('#result');
    result.style.display = "block";

}



function tryAgain() {
    location.reload();
}
document.querySelector('#submit-btn').addEventListener('click', submit);

function submit() {
    const i = confirm('Do you want to submit?')
    if (i == true) {
        check()
    }
}
