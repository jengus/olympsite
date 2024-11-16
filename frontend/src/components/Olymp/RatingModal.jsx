import React, { useState, useEffect } from "react";
import Modal from "react-bootstrap/Modal";
import Table from "react-bootstrap/Table";
import { Button, Spinner } from "react-bootstrap";
import { useUserContext } from "../../context/UserContext";
import { notifyError } from "../Notification";

const RatingModal = ({token, active, handleModal, task_id, task_title, olymp_id }) => {
  const [ratings, setRatings] = useState([]);
  const [experts, setExperts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [,,user] = useUserContext();

  useEffect(() => {
    if (active) {
      const fetchRatings = async () => {
        setLoading(true);
        const requestOptions = {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
        };
        try {
          const response = await fetch(`${process.env.REACT_APP_API_URL}/olymp/expert/answer/${olymp_id}/${task_id}/localrate`, requestOptions);
          const data = await response.json();
          if (response.ok) {
            setRatings(Array.isArray(data) ? data : []);

            const uniqueExperts = [...new Set(data.flatMap((item) => 
              item.experts ? item.experts.map((expert) => expert.expert_id) : []
            ))];
            setExperts(uniqueExperts);
          } else {
            notifyError("Ошибка загрузки рейтинга")
          }
          
        } catch (error) {
          notifyError("Ошибка при получении данных рейтинга:" + error);
        } finally {
          setLoading(false);
        }
      };

      fetchRatings();
    }
  }, [active, olymp_id, task_id]);

  if (loading) {
    return (
      <Modal size="lg" show={active} onHide={handleModal}>
        <Modal.Header closeButton> 
          Рейтинг "{task_title}"
        </Modal.Header>
        <Modal.Body className="text-center">
          <Spinner animation="border" />
        </Modal.Body>
      </Modal>
    );
  }

  return (
    <Modal size="lg" show={active} onHide={handleModal}>
      <Modal.Header closeButton>
        Рейтинг "{task_title}"
      </Modal.Header>
      <Modal.Body>
        <Table bordered hover>
          <thead>
            <tr>
              <th>Участник</th>
              {experts.map((expert_id) => (
                <th key={expert_id}>{user.id === expert_id ? "Вы" : "Эксперт"}</th>
              ))}
              <th>Средний балл</th>
            </tr>
          </thead>
          <tbody>
            {Array.isArray(ratings) && ratings.map((rating) => {
              // Вычисление среднего балла для текущего участника
              const totalRate = rating.experts?.reduce((sum, expert) => sum + (expert.rate || 0), 0) || 0;
              const rateCount = rating.experts?.filter(expert => expert.rate !== null).length || 0;
              const averageRate = rateCount > 0 ? (totalRate / rateCount).toFixed(1) : "0";

              return (
                <tr key={rating.participant_id} style={{ backgroundColor: rating.experts === null ? "lightcoral" : "white" }}>
                  <td>{rating.participant_id}</td>
                  {experts.map((expert_id) => {
                    const expertRate = rating.experts?.find((expert) => expert.expert_id === expert_id);
                    const rateValue = expertRate ? expertRate.rate : null;

                    return (
                      <td
                        key={expert_id}
                        style={{
                          color: rateValue === null ? "gray" : "black",
                          backgroundColor: rateValue === null && rating.experts ? "lightgray" : "inherit",
                        }}
                      >
                        {rateValue === null ? 0 : rateValue}
                      </td>
                    );
                  })}
                  <td>{averageRate}</td>
                </tr>
              );
            })}
          </tbody>
        </Table>
      </Modal.Body>
      <Modal.Footer>
        <Button onClick={handleModal}>Закрыть</Button>
      </Modal.Footer>
    </Modal>
  );
};

export default RatingModal;
