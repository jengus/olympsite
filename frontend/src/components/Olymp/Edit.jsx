import React, { useState, useContext, useEffect } from "react";
import {
  Card,
  Form,
  Container,
  Row,
  Col,
  Button,
  Spinner,
  Table,
} from "react-bootstrap";
import ErrorMessage from "../ErrorMessage";
import DatePicker from "react-datepicker";
import { useUserContext } from "../../context/UserContext";
import { useNavigate, useParams } from "react-router";
import TaskModal from "./TaskModal";
import ReactQuill from "react-quill";
import { notifyError, notifySuccess, notifyWarn } from "../Notification";
import Loading from "../Loading";

const Edit = () => {
  const { id } = useParams();
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const minDate = new Date();
  const [minEndDate, setMinEndDate] = useState(null);
  const [token, , user] = useUserContext();
  const [loadOlympBtn, setLoadOlympBtn] = useState(false);
  const [loadAssignBtn, setLoadAssignBtn] = useState(false);
  const [loadingOlymp, setLoadingOlymp] = useState(true);
  const [loadingTasks, setLoadingTasks] = useState(true);
  const [loadingExperts, setLoadingExperts] = useState(true);
  const [loadingAssignments, setLoadingAssignments] = useState(true);
  const [updateTasks, setUpdateTasks] = useState(false);
  const [tasks, setTasks] = useState([]);
  const [activeModal, setActiveModal] = useState(false);
  const [task, setTask] = useState(null);
  const [experts, setExperts] = useState([]);
  const [assignments, setAssignments] = useState({});
  const [deletingTaskIds, setDeletingTaskIds] = useState([]);
  const navigate = useNavigate();

  const handleModal = () => {
    setTask(null);
    setActiveModal(!activeModal);
    if (activeModal) {
      fetchTasks();
    }
  };
  const handleModalWithoutChanges = () => {
    setTask(null);
    setActiveModal(!activeModal);
  };
  const fetchOlymp = async () => {
    if (id) {
      const requestOptions = {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + token,
        },
      };
      try {
        const response = await fetch(
          `${process.env.REACT_APP_API_URL}/olymp/${id}`,
          requestOptions
        );
        const data = await response.json();
        if (response.ok) {
          setName(data.name || "");
          setDescription(data.description || "");
          setStartDate(
            data.start_date ? new Date(data.start_date + "Z") : null
          );
          setMinEndDate(
            data.start_date ? new Date(data.start_date + "Z") : null
          );
          setEndDate(data.end_date ? new Date(data.end_date + "Z") : null);
          setLoadingOlymp(false);
          fetchTasks();
        } else {
          notifyError("Ошибка получения данных олимпиады ", data.detail);
        }
      } catch (error) {
        notifyError("Ошибка запроса получения данных олимпиады.");
      } finally {
      }
    }
  };

  useEffect(() => {
    fetchOlymp();
    fetchTasks();
    getExperts();
    fetchAssignments();
  }, [id]);

  const handleSave = async () => {
    try {
      setLoadOlympBtn(true);
      const requestOptions = {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + token,
        },
        body: JSON.stringify({
          name,
          description,
          start_date: startDate ? startDate.toISOString() : null,
          end_date: endDate ? endDate.toISOString() : null,
        }),
      };

      const response = await fetch(
        `${process.env.REACT_APP_API_URL}/olymp/${id}`,
        requestOptions
      );
      if (response.ok) {
        notifySuccess("Успешное сохранение данных олимпиады.");
      } else {
        notifyError("Ошибка сохранения данных олимпиады.");
      }
    } catch (error) {
      notifyError("Ошибка запроса сохранения данных олимпиады.");
    } finally {
      setLoadOlympBtn(false);
    }
  };

  const handleStartDateChange = (date) => {
    setStartDate(date);
    setMinEndDate(date);
    if (date > endDate) {
      setEndDate(date);
    } // Установка минимальной даты для endDate
  };

  const fetchTasks = async () => {
    setUpdateTasks(true);
    const requestOptions = {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + token,
      },
    };
    try {
      const response = await fetch(
        `${process.env.REACT_APP_API_URL}/olymp/${id}/tasks`,
        requestOptions
      );
      const data = await response.json();
      if (response.ok) {
        setTasks(data);
        setUpdateTasks(false);
        setLoadingTasks(false);
      } else {
        notifyError("Ошибка получения заданий ", data.detail);
      }
    } catch (error) {
      notifyError("Ошибка запроса получения заданий.");
    }
  };
  const handleDeleteTask = async (taskId) => {
    setDeletingTaskIds((prev) => [...prev, taskId]);
    const requestOptions = {
      method: "DELETE",
      headers: {
        "Content-type": "application/json",
        Authorization: "Bearer " + token,
      },
    };
    try {
      const response = await fetch(
        `${process.env.REACT_APP_API_URL}/olymp/tasks/${taskId}`,
        requestOptions
      );
      const data = await response.json();
      if (!response.ok) {
        notifyError("Ошибка удаления задания ", data.detail);
      } else {
        notifySuccess("Успешное удаление задания.");
        fetchTasks();
      }
    } catch (error) {
      notifyError("Ошибка запроса удаления задания.");
    } finally {
      setDeletingTaskIds((prev) => prev.filter((id) => id !== taskId));
    }
  };

  const handleModalData = (taskData) => {
    setTask(taskData);
    setActiveModal(true);
  };
  const getExperts = async () => {
    const requestOptions = {
      method: "GET",
      headers: {
        "Content-type": "application/json",
        Authorization: "Bearer " + token,
      },
    };
    try {
      const response = await fetch(
        `${process.env.REACT_APP_API_URL}/customusers/experts`,
        requestOptions
      );
      const data = await response.json();
      if (!response.ok) {
        notifyError("Ошибка получения экспертов ", data.detail);
      } else {
        setExperts(data);
        setLoadingExperts(false);
      }
    } catch (error) {
      notifyError("Ошибка запроса получения экспертов.");
    }
  };

  const handleCheckboxChange = (taskId, expertId) => {
    setAssignments((prevAssignments) => ({
      ...prevAssignments,
      [taskId]: {
        ...prevAssignments[taskId],
        [expertId]: !prevAssignments[taskId]?.[expertId],
      },
    }));
  };
  const fetchAssignments = async () => {
    const requestOptions = {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + token,
      },
    };
    try {
      const response = await fetch(
        `${process.env.REACT_APP_API_URL}/olymp/get_assignments/${id}`,
        requestOptions
      );
      const data = await response.json();
      if (response.ok) {
        const newAssignments = {};
        data.forEach((assignment) => {
          if (!newAssignments[assignment.task_id]) {
            newAssignments[assignment.task_id] = {};
          }
          newAssignments[assignment.task_id][assignment.user_id] = true;
        });
        setAssignments(newAssignments);
        setLoadingAssignments(false);
      } else {
        notifyError("Ошибка получения таблицы проверки ", data.detail);
      }
    } catch (error) {
      notifyError("Ошибка запроса получения таблицы проверки");
    }
  };

  const handleSaveAssignments = async () => {
    try {
      setLoadAssignBtn(true);
      const assignmentsArray = Object.keys(assignments).reduce(
        (acc, taskId) => {
          const taskAssignments = assignments[taskId];
          Object.keys(taskAssignments).forEach((expertId) => {
            if (taskAssignments[expertId]) {
              acc.push({ task_id: Number(taskId), user_id: Number(expertId) });
            }
          });
          return acc;
        },
        []
      );

      const requestOptions = {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + token,
        },
        body: JSON.stringify(assignmentsArray),
      };

      const response = await fetch(
        `${process.env.REACT_APP_API_URL}/olymp/save_assignments/`,
        requestOptions
      );
      if (response.ok) {
        notifySuccess("Успешное сохранение таблицы проверки.");
      } else {
        notifyError("Ошибка сохранение таблицы проверки.");
      }
    } catch (error) {
      notifyError("Ошибка сохранение таблицы проверки.");
    } finally {
      setLoadAssignBtn(false);
    }
  };

  const handlePreview = () => {
    const queryParams = new URLSearchParams({
      name,
      description,
      startDate: startDate ? startDate.toISOString() : "",
      endDate: endDate ? endDate.toISOString() : "",
      tasks: JSON.stringify(tasks),
    }).toString();
    navigate(`/preview?${queryParams}`);
  };

  if (loadingAssignments || loadingExperts || loadingOlymp || loadingTasks) {
    return <Loading />;
  }
  return (
    <>
      <TaskModal
        active={activeModal}
        handleModal={handleModal}
        task={task}
        olymp_id={id}
        handleModalWithoutChanges={handleModalWithoutChanges}
      />

      <Card className="mx-5 mt-2">
        <Card.Header className="d-flex justify-content-center">
          Редактирование олимпиады
        </Card.Header>
        <Card.Body>
          <Form.Group>
            <Form.Label>Название</Form.Label>
            <Form.Control
              type="name"
              placeholder="Введите название олимпиады"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </Form.Group>
          <Form.Group className="mt-2">
            <Form.Label>Описание</Form.Label>
            <ReactQuill
              theme="snow"
              value={description}
              onChange={setDescription}
              modules={{
                toolbar: [
                  [{ header: "1" }, { header: "2" }, { font: [] }],
                  [{ align: [] }],
                  [{ size: [] }],
                  ["bold", "italic", "underline", "strike", "blockquote"],
                  [
                    { list: "ordered" },
                    { list: "bullet" },
                    { indent: "-1" },
                    { indent: "+1" },
                  ],
                  ["link", "image"],
                ],
              }}
              formats={[
                "header",
                "font",
                "size",
                "bold",
                "italic",
                "underline",
                "strike",
                "blockquote",
                "list",
                "bullet",
                "indent",
                "link",
                "image",
                "align",
              ]}
            />
          </Form.Group>
          <Form.Group className="mt-2">
            <Row>
              <Col className="col-auto">
                Дата начала
                <DatePicker
                  selected={startDate}
                  onChange={(date) => handleStartDateChange(date)}
                  showTimeSelect
                  showIcon
                  timeIntervals={30}
                  dateFormat="MM-dd-yyyy HH:mm"
                  timeFormat="HH:mm"
                  minDate={minDate}
                  className="ms-1"
                />
              </Col>
              <Col>
                Дата конца
                <DatePicker
                  selected={endDate}
                  onChange={(date) => setEndDate(date)}
                  showTimeSelect
                  showIcon
                  timeIntervals={30}
                  dateFormat="MM-dd-yyyy HH:mm"
                  timeFormat="HH:mm"
                  minDate={minEndDate}
                  className="ms-1"
                />
              </Col>
              <Col className="col-auto">
                <Button onClick={handleSave} disabled={loadOlympBtn}>
                  {loadOlympBtn ? (
                    <Spinner animation="border" size="sm" />
                  ) : (
                    "Сохранить"
                  )}
                </Button>
              </Col>
            </Row>
          </Form.Group>
          <Form className="d-flex justify-content-center mt-1">
            <Button onClick={handlePreview}>Предварительный просмотр</Button>
          </Form>
          <Form className="d-flex justify-content-center">
            <Form.Label>
              <h2>Задания</h2>
            </Form.Label>
          </Form>
          {updateTasks ? (
            <>
              <Loading />
            </>
          ) : (
            <>
              {tasks.map((one_task) => (
                <Container className="bg-light border rounded border-dark p-2 px-3 mb-2">
                  <Row>
                    <Col
                      style={{ fontWeight: "bold" }}
                      className="d-flex align-items-center"
                    >
                      {one_task.task_number}. {one_task.title}
                    </Col>
                    <Col md="auto" className="p-0 px-1">
                      <Button
                        classname="m-0"
                        onClick={() => handleModalData(one_task)}
                      >
                        Редактировать
                      </Button>
                    </Col>
                    <Col md="auto" className="p-0 px-1">
                      <Button
                        variant="danger"
                        className="m-0"
                        onClick={() => handleDeleteTask(one_task.id)}
                        disabled={deletingTaskIds.includes(one_task.id)}
                      >
                        {deletingTaskIds.includes(one_task.id) ? (
                          <Spinner animation="border" size="sm" />
                        ) : (
                          "Удалить"
                        )}
                      </Button>
                    </Col>
                  </Row>
                </Container>
              ))}
              <Form className="d-flex justify-content-center mt-1">
                <Button onClick={handleModal}>Добавить задание</Button>
              </Form>
              <Card className="mt-2 mx-auto" style={{ width: "fit-content" }}>
                <Card.Header className="d-flex justify-content-between align-items-center">
                  Назначение экспертов
                  <Button
                    className="ms-2"
                    onClick={handleSaveAssignments}
                    disabled={loadAssignBtn}
                  >
                    {loadAssignBtn ? (
                      <Spinner animation="border" size="sm" />
                    ) : (
                      "Сохранить"
                    )}
                  </Button>
                </Card.Header>
                <Card.Body>
                  <Table bordered>
                    <thead>
                      <tr>
                        <th>Эксперт/Задание</th>
                        {tasks.map((task) => (
                          <th key={task.id}>{task.task_number}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {experts.map((expert) => (
                        <tr key={expert.id}>
                          <td>{`${expert.lastname} ${expert.name}`}</td>
                          {tasks.map((task) => (
                            <td key={task.id}>
                              <Form.Check
                                type="checkbox"
                                checked={
                                  assignments[task.id]?.[expert.id] || false
                                }
                                onChange={() =>
                                  handleCheckboxChange(task.id, expert.id)
                                }
                              />
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                </Card.Body>
              </Card>
            </>
          )}
        </Card.Body>
      </Card>
    </>
  );
};

export default Edit;
