import React, { useState, useEffect } from "react";
import { Spinner, Form, Card, Button, Badge, ListGroup, CardFooter } from "react-bootstrap";
import Loading from "../Loading";
import { notifyError, notifySuccess } from "../Notification";
import RatingModal from "./RatingModal";
import SelfRatingModal from "./SelfRatingModal";

const MAX_CACHED_ANSWERS = 50;

const AnswersCard = ({ olympId, taskId, taskTitle, weight, token }) => {
  const [answersIds, setAnswersIds] = useState([]);
  const [answers, setAnswers] = useState(new Map());
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [currentAnswerId, setCurrentAnswerId] = useState(null); // Хранит id активного ответа
  const [rate, setRate] = useState(""); 
  const [rateError, setRateError] = useState(""); 
  const [activeModal, setActiveModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingAnswer, setLoadingAnswer] = useState(false);
  const [loadSaveBtn, setLoadSaveBtn] = useState(false);

  useEffect(() => {
    fetchAnswersIds();
  }, []);

  const fetchAnswersIds = async () => {
    const requestOptions = {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    };
    try {
      const response = await fetch(
        `${process.env.REACT_APP_API_URL}/olymp/expert/answers/${taskId}`,
        requestOptions
      );
      const data = await response.json();
      if (response.ok) {
        setAnswersIds(data);
        setLoading(false);
      } else {
        notifyError("Ошибка загрузки ответов:"+ data.detail);
      }
    } catch (error) {
      notifyError("Ошибка запроса загрузки ответов:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAnswerById = async (answerId) => {
    setLoadingAnswer(true);
    const requestOptions = {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    };
    try {
    const response = await fetch(
      `${process.env.REACT_APP_API_URL}/olymp/expert/answer/${answerId}`,
      requestOptions
    );
    const data = await response.json();
    if (response.ok) {
      setLoadingAnswer(false);
      return data;
    } else {
      notifyError("Ошибка загрузки ответа:");
    }} catch (error) {
      notifyError("Ошибка запроса загрузки ответа")
    } finally {
      setLoadingAnswer(false);
    }
  };

  const handleSelectAnswer = async (answerId) => {
    setRateError("");
    setCurrentAnswerId(answerId); // Устанавливаем активный ответ
    if (answers.has(answerId)) {
      const answer = answers.get(answerId);
      setSelectedAnswer(answer);
      setRate(answer.rate || 0); 
    } else {
      const answerData = await fetchAnswerById(answerId);
      if (answerData) {
        const newAnswers = new Map(answers);
        if (newAnswers.size >= MAX_CACHED_ANSWERS) {
          const oldestKey = newAnswers.keys().next().value;
          newAnswers.delete(oldestKey);
        }
        newAnswers.set(answerId, answerData);
        setAnswers(newAnswers);
        setSelectedAnswer(answerData);
        setRate(answerData.rate || 0); 
      }
    }
  };

  const handleSaveRate = async () => {
    setLoadSaveBtn(true);
    if (!selectedAnswer) return;

    if (!isRateValid()) {
      return;
    }

    const answerInIds = answersIds.find(
      (answer) => answer.answer_id === selectedAnswer.answer_id
    );
    const isChecked = answerInIds ? answerInIds.checked : false;
    const requestOptions = {
      method: isChecked ? "PATCH" : "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    };

    try {
      const response = await fetch(
        `${process.env.REACT_APP_API_URL}/olymp/expert/answer/${selectedAnswer.answer_id}/rate/${rate}`,
        requestOptions
      );

      if (response.ok) {
        const updatedAnswer = { ...selectedAnswer, rate, checked: true };
        setAnswers((prevAnswers) =>
          new Map(prevAnswers).set(selectedAnswer.answer_id, updatedAnswer)
        );
        setSelectedAnswer(updatedAnswer);
        setAnswersIds((prevIds) =>
          prevIds.map((answer) =>
            answer.answer_id === selectedAnswer.answer_id
              ? { ...answer, checked: true }
              : answer
          )
        );
        notifySuccess("Успешное сохранение оценки")
        setLoadSaveBtn(false);
      } else {
        const data = await response.json();
        notifyError("Ошибка сохранения оценки:", data.detail);
      }
    } catch (error) {
      notifyError("Ошибка при запросе на сохранение оценки:", error);
    } finally {
      setLoadSaveBtn(false);
    }
  };

  const handleDownloadAttachment = async (attachmentId, filename) => {
    try {
      const response = await fetch(
        `${process.env.REACT_APP_API_URL}/olymp/download/answer/${attachmentId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.setAttribute("download", filename);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      } else {
        notifyError("Ошибка загрузки вложения", response.statusText);
      }
    } catch (error) {
      notifyError("Ошибка при загрузке файла:", error);
    }
  };

  const handleRateChange = (e) => {
    const value = e.target.value;
    if (value === "" || (/^\d+$/.test(value) && Number(value) <= weight && Number(value) >= 0)) {
      setRate(value === "" ? "" : Number(value));
      setRateError("");
    } 
  };

  const isRateValid = () => {
    if (rate === "" || rate < 0 || rate > weight) {
      setRateError("Оценка должна быть числом от 0 до веса задания включительно.");
      return false;
    }
    return true;
  };

  const handleModal = () => {
    setActiveModal(!activeModal);
  };

  return (<>
    <SelfRatingModal
      active={activeModal}
      handleModal={handleModal}
      answersIds = {answersIds}
      task_title={taskTitle}
    />
    <Card className="mt-2">
      <Card.Header className="d-flex justify-content-between align-items-center" style={{ fontWeight: "bold" }}>
        Ответы
        <Button onClick={handleModal}>Рейтинг</Button>
      </Card.Header>
      <Card.Body>{loading? (<Loading/>):(<><div className="d-flex flex-wrap mb-3">
          {answersIds.map((answer) => (
            <Button
              key={answer.answer_id}
              variant={
                answer.answer_id === currentAnswerId 
                  ? "primary" 
                  : answer.checked ? "success" : "secondary"
              }
              onClick={() => handleSelectAnswer(answer.answer_id)}
              className="m-1"
            >
              {answer.user_id}
            </Button>
          ))}
        </div>
        {selectedAnswer && (
          <>
            <h5>{selectedAnswer.title}</h5>
            <div
              dangerouslySetInnerHTML={{ __html: selectedAnswer.content }}
              className="view ql-editor mb-3"
            />
            {selectedAnswer.attachments.length > 0 && (
              <ListGroup>
                {selectedAnswer.attachments.map((attachment) => (
                  <ListGroup.Item key={attachment.id}>
                    {attachment.filename}
                    <Badge
                      bg="success"
                      className="ms-3"
                      onClick={() =>
                        handleDownloadAttachment(attachment.id, attachment.filename)
                      }
                    >
                      Скачать
                    </Badge>
                  </ListGroup.Item>
                ))}
              </ListGroup>
            )}
          </>
        )}</>)}      
      </Card.Body>
      {loadingAnswer ? (<CardFooter><Loading/></CardFooter>):(<Card.Footer>
        {selectedAnswer && (
          <Form>
            <Form.Group controlId="formRate" className="d-flex align-items-center">
              <Form.Label className="me-2">Оценка ответа:</Form.Label>
              <Form.Control
                type="number"
                placeholder="Введите оценку задания"
                value={rate}
                onChange={handleRateChange}
                min="0"
                max={weight}
                step="1"
                isInvalid={!!rateError}
                required
                className="me-2"
              />
              <Form.Control.Feedback type="invalid" className="d-block">
                {rateError}
              </Form.Control.Feedback>
              <Button onClick={handleSaveRate} variant="success">
                {loadSaveBtn ? (<Spinner animation="border" size="sm" />):("Сохранить оценку")}
              </Button>
            </Form.Group>
          </Form>
        )}
      </Card.Footer>)}
    </Card></>
  );
};

export default AnswersCard;
