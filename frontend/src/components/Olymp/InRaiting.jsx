import React, { useState, useEffect } from "react";
import { Card, Table, Spinner, ButtonGroup, Button } from "react-bootstrap";
import { useParams } from "react-router-dom";
import { useUserContext } from "../../context/UserContext";
import Loading from "../Loading";
import RatingModal from "./RatingModal"; // Подключаем RatingModal
import { notifyError } from "../Notification";

const InRaiting = () => {
  const [token] = useUserContext();
  const [ratingsData, setRatingsData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { id } = useParams();
  const [expandedParticipantIds, setExpandedParticipantIds] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [filter, setFilter] = useState("all");
  const [loadDownloadList, setLoadDownloadList] = useState(false);

  useEffect(() => {
    const fetchRatings = async () => {
      try {
        const requestOptions = {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        };
        const response = await fetch(
          `${process.env.REACT_APP_API_URL}/olymp/org/totalrating/${id}`,
          requestOptions
        );
        const data = await response.json();
        setRatingsData(Array.isArray(data) ? data : []);
      } catch (err) {
        setError("Ошибка при загрузке данных");
        setRatingsData([]);
      } finally {
        setLoading(false);
      }
    };

    fetchRatings();
  }, [id, token]);

  const handleDownload = async (olymp_id) => {
    let url = null;
    try {
      const response = await fetch(
        `${process.env.REACT_APP_API_URL}/olymp/download/participants/${olymp_id}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const filename = `participants_${olymp_id}.xlsx`;
        const link = document.createElement("a");
        link.href = url;
        link.setAttribute("download", filename);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } else {
        const data = await response.json();
        notifyError(`Ошибка загрузки файла: ${data.detail}`);
      }
    } catch (error) {
      notifyError("Ошибка при загрузке файла:", error.message);
    } finally {
      window.URL.revokeObjectURL(url);
    }
  };

  // Уникальные задания с task_num, task_id, task_weight
  const uniqueTasks = [
    ...new Map(
      ratingsData
        .flatMap((participant) => participant.tasks || [])
        .map((task) => [task.task_num, task]) // task_num как ключ
    ).values(),
  ].sort((a, b) => a.task_num - b.task_num);

  const totalTaskWeight = uniqueTasks.reduce(
    (sum, task) => sum + (task.task_weight || 0),
    0
  );

  const participantsWithSum = ratingsData.map((participant) => {
    const totalScore = participant.tasks
      ? participant.tasks.reduce(
          (sum, task) =>
            sum + (task.is_checked && task.rate != null ? task.rate : 0),
          0
        )
      : 0;
    return { ...participant, totalScore };
  });

  const sortedParticipants = participantsWithSum.sort(
    (a, b) => b.totalScore - a.totalScore
  );

  const filteredParticipants = sortedParticipants.filter((participant) => {
    if (filter === "individual") return !participant.is_team;
    if (filter === "team") return participant.is_team;
    return true;
  });

  const getCellStyleAndValue = (task) => {
    if (!task) return { style: { backgroundColor: "lightcoral", color: "gray" }, value: 0 };
    if (!task.is_checked)
      return { style: { backgroundColor: "lightgray", color: "gray" }, value: 0 };
    if (task.rate === null)
      return { style: { backgroundColor: "lightcoral", color: "gray" }, value: 0 };
    return { style: { backgroundColor: "white", color: "black" }, value: task.rate };
  };

  const handleRowClick = (participantId) => {
    setExpandedParticipantIds((prevState) =>
      prevState.includes(participantId)
        ? prevState.filter((id) => id !== participantId)
        : [...prevState, participantId]
    );
  };

  const handleTaskClick = (task) => {
    setSelectedTask(task);
    setModalVisible(true);
  };

  if (loading) return <Loading />;
  if (error) return <div>{error}</div>;

  return (
    <>
      <Card className="mx-5 mt-2">
        <Card.Header className="d-flex justify-content-between align-items-center">
          Рейтинг олимпиады
          <Button onClick={() => handleDownload(id)} disabled={loadDownloadList}>
            {loadDownloadList ? <Spinner animation="border" size="sm" /> : "Скачать данные участников"}
          </Button>
        </Card.Header>
        <Card.Body>
          <ButtonGroup className="mb-3">
            <Button variant="primary" onClick={() => setFilter("all")} active={filter === "all"}>
              Все
            </Button>
            <Button onClick={() => setFilter("individual")} active={filter === "individual"}>
              Участники
            </Button>
            <Button onClick={() => setFilter("team")} active={filter === "team"}>
              Команды
            </Button>
          </ButtonGroup>

          <Table bordered hover responsive>
            <thead>
              <tr>
                <th>Место</th>
                <th>Участник</th>
                {uniqueTasks.map((task) => (
                  <th key={task.task_id} onClick={() => handleTaskClick(task)}>
                    Задание {task.task_num} ({task.task_weight})
                  </th>
                ))}
                <th>Сумма баллов ({totalTaskWeight})</th>
              </tr>
            </thead>
            <tbody>
              {filteredParticipants.map((participant, index) => (
                <React.Fragment key={participant.participant_id}>
                  <tr
                    onClick={() => handleRowClick(participant.participant_id)}
                    style={{
                      backgroundColor: participant.tasks === null ? "lightcoral" : "inherit",
                      cursor: "pointer",
                    }}
                  >
                    <td>{index + 1}</td>
                    <td>{participant.participant_id}</td>
                    {uniqueTasks.map((task) => {
                      const taskData = participant.tasks?.find((t) => t.task_num === task.task_num);
                      const { style, value } = getCellStyleAndValue(taskData);
                      return (
                        <td key={task.task_id} style={style}>
                          {value}
                        </td>
                      );
                    })}
                    <td>{participant.totalScore}</td>
                  </tr>
                  {expandedParticipantIds.includes(participant.participant_id) && (
                    <tr>
                      <td colSpan={uniqueTasks.length + 3} style={{ backgroundColor: "#f8f9fa" }}>
                        <div>
                          <strong>Email:</strong> {participant.email}
                          <br />
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </Table>
        </Card.Body>
      </Card>
      <RatingModal
        token={token}
        active={modalVisible}
        handleModal={() => setModalVisible(false)}
        task_id={selectedTask?.task_id} // task_id
        task_title={`Задание ${selectedTask?.task_num}`}
        olymp_id={id}
      />
    </>
  );
};

export default InRaiting;
