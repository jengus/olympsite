import React from "react";
import { Modal, Table, Button } from "react-bootstrap";

const SelfRatingModal = ({ active, handleModal, answersIds, task_title }) => {
  // Сортируем ответы по баллам от наибольшего к наименьшему. 
  // Если оценки нет, ставим значение 0 для корректной сортировки.
  const sortedAnswers = [...answersIds].sort((a, b) => (b.rate || 0) - (a.rate || 0));

  return (
    <Modal size="lg" show={active} onHide={handleModal}>
      <Modal.Header closeButton>
        <Modal.Title>Рейтинг по задаче "{task_title}"</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Table bordered hover>
          <thead>
            <tr>
              <th>Участник</th>
              <th>Оценка</th>
            </tr>
          </thead>
          <tbody>
            {sortedAnswers.map((answer) => (
              <tr key={answer.answer_id}>
                <td>{answer.user_id}</td>
                <td
                  style={{
                    backgroundColor: answer.checked ? "white" : "lightgray",
                    color: answer.checked ? "black" : "gray",
                  }}
                >
                  {answer.checked ? answer.rate : 0}
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={handleModal}>
          Закрыть
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default SelfRatingModal;
