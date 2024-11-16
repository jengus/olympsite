import React, { useState, useEffect } from "react";
import Modal from "react-bootstrap/Modal";
import Form from "react-bootstrap/Form";
import {
  Button,
  ListGroup,
  Badge,
  Spinner,
  ProgressBar,
} from "react-bootstrap";
import { useUserContext } from "../../context/UserContext";
import ReactQuill from "react-quill";
import ErrorMessage from "../ErrorMessage";
import { notifyError, notifyWarn, notifySuccess } from "../Notification";


const TaskModal = ({ active, handleModal, task, olymp_id, handleModalWithoutChanges }) => {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [weight, setWeight] = useState("");
  const [token] = useUserContext();
  const [taskId, setTaskId] = useState("");
  const [files, setFiles] = useState([]);
  const [existingAttachments, setExistingAttachments] = useState([]);
  const [errorMessage, setErrorMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [fieldErrors, setFieldErrors] = useState({});

  const handleFileChange = (e) => {
    setFiles(e.target.files);
  };

  const handleDeleteAttachment = (attachmentId) => {
    setExistingAttachments(
      existingAttachments.filter((att) => att.id !== attachmentId)
    );
  };

  const clearForm = () => {
    setTitle("");
    setContent("");
    setWeight("");
    setTaskId("");
    setExistingAttachments([]);
    setFiles([]);
    setErrorMessage("");
    setFieldErrors({}); 
  };

  const handleCreate = async (event) => {
    event.preventDefault();

    if (!isFormValid()) {
      return;
    }

    setLoading(true);
    const formData = new FormData();
    formData.append("title", title);
    formData.append("content", content);
    formData.append("weight", weight);

    for (let i = 0; i < files.length; i++) {
      formData.append("files", files[i]);
    }

    const xhr = new XMLHttpRequest();
    xhr.open("POST", `${process.env.REACT_APP_API_URL}/olymp/${olymp_id}/tasks`, true);
    xhr.setRequestHeader("Authorization", "Bearer " + token);

    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) {
        const progress = (event.loaded / event.total) * 100;
        setUploadProgress(progress);
      }
    };

    xhr.onload = () => {
      setLoading(false);
      if (xhr.status === 200) {
        notifySuccess("Успешное создание задания.")
        clearForm();
        handleModal();
      } else {
        const responseText = xhr.responseText;
        try {
          const data = JSON.parse(responseText);
          notifyError(data.detail || "Ошибка при создании задания.");
          setErrorMessage(data.detail || "Ошибка при создании задания.");
        } catch (error) {
          notifyError("Ошибка при создании задания.")
          setErrorMessage("Ошибка при создании задания.");
        }
      }
    };

    xhr.onerror = () => {
      setLoading(false);
      notifyError("Ошибка запроса создания задания.")
      setErrorMessage("Ошибка запроса создания задания.");
    };

    xhr.send(formData);
  };

  const handleUpdate = async (event) => {
    event.preventDefault();

    if (!isFormValid()) {
      notifyWarn("Ошибка заполнения.");
      return;
    }

    setLoading(true);
    const formData = new FormData();
    formData.append("title", title);
    formData.append("content", content);
    formData.append("weight", weight);

    for (let i = 0; i < files.length; i++) {
      formData.append("files", files[i]);
    }
    existingAttachments.forEach((att) => {
      formData.append("remaining_files", att.id);
    });

    const xhr = new XMLHttpRequest();
    xhr.open(
      "PATCH",
      `${process.env.REACT_APP_API_URL}/olymp/${olymp_id}/tasks/${taskId}`,
      true
    );
    xhr.setRequestHeader("Authorization", "Bearer " + token);

    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) {
        const progress = (event.loaded / event.total) * 100;
        setUploadProgress(progress);
      }
    };

    xhr.onload = () => {
      setLoading(false);
      if (xhr.status === 200) {
        notifySuccess("Успешное обновление задания.")
        clearForm();
        handleModal();
      } else {
        const responseText = xhr.responseText;
        try {
          const data = JSON.parse(responseText);
          notifyError(data.detail || "Ошибка при создании задания.");
          setErrorMessage(data.detail || "Ошибка при обновлении задания.");
        } catch (error) {
          notifyError("Ошибка при обновлении задания.")
          setErrorMessage("Ошибка при обновлении задания.");
        }
      }
    };

    xhr.onerror = () => {
      setLoading(false);
      notifyError("Ошибка запроса обновления задания.")
      setErrorMessage("Ошибка запроса обновления задания.");
    };

    xhr.send(formData);
  };

  const isFormValid = () => {
    const errors = {};

    if (!title) {
      errors.title = "Поле не может быть пустым.";
    }

    if (!content) {
      errors.content = "Поле не может быть пустым.";
    }

    if (!weight || !/^\d+$/.test(weight) || parseInt(weight) <= 0) {
      errors.weight =
        "Положительное целочисленное значение.";
    }

    setFieldErrors(errors);

    return Object.keys(errors).length === 0;
  };

  useEffect(() => {
    if (task) {
      setTitle(task.title);
      setContent(task.content);
      setWeight(task.weight);
      setTaskId(task.id);
      setExistingAttachments(task.attachments);
    } else {
      clearForm();
    }
  }, [task]);

  return (
    <Modal size="lg" show={active} onHide={handleModalWithoutChanges}>
      <Modal.Header closeButton>
        <Modal.Title>
          {task ? "Редактировать задание" : "Добавить задание"}
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Form onSubmit={task ? handleUpdate : handleCreate}>
          <Form.Group controlId="formExerciseName">
            <Form.Label>Название упражнения</Form.Label>
            <Form.Control
              type="text"
              placeholder="Введите название упражнения"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              isInvalid={!!fieldErrors.title}
            />
            <Form.Control.Feedback type="invalid">
              {fieldErrors.title}
            </Form.Control.Feedback>
          </Form.Group>

          <Form.Group controlId="formContent">
            <Form.Label>Текст задания</Form.Label>
            <ReactQuill
              theme="snow"
              value={content}
              onChange={setContent}
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
            {fieldErrors.content && (
              <p className="text-danger">Поле не должно быть пустым</p>
            )}
          </Form.Group>
          <Form.Group>
            <Form.Label>Вес задания</Form.Label>
            <Form.Control
              type="number"
              placeholder="Введите вес задания"
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
              required
              isInvalid={!!fieldErrors.weight}
            />
            <Form.Control.Feedback type="invalid">
              {fieldErrors.weight}
            </Form.Control.Feedback>
          </Form.Group>
          <Form.Group controlId="formFile" className="mb-3">
            <Form.Label>Выберите файлы к заданию</Form.Label>
            <Form.Control type="file" multiple onChange={handleFileChange} />
          </Form.Group>
          <Form.Group controlId="formAttachments">
            {existingAttachments.length > 0 && (
              <>
                <Form.Label>Прикрепленные файлы</Form.Label>
                <ListGroup>
                  {existingAttachments.map((attachment) => (
                    <ListGroup.Item key={attachment.id}>
                      <span>{attachment.filename}</span>
                      <Badge
                        bg="danger"
                        className="ms-3"
                        onClick={() => handleDeleteAttachment(attachment.id)}
                      >
                        Удалить
                      </Badge>
                    </ListGroup.Item>
                  ))}
                </ListGroup>
              </>
            )}
          </Form.Group>
        </Form>
        {loading && (
          <ProgressBar
            now={uploadProgress}
            label={`${Math.round(uploadProgress)}%`}
          />
        )}
        <ErrorMessage message={errorMessage} />
      </Modal.Body>
      <Modal.Footer>
        {task ? (
          <Button onClick={handleUpdate} className="save" disabled={loading}>
            {loading ? (
              <Spinner as="span" animation="border" size="sm" role="status" />
            ) : (
              "Изменить"
            )}
          </Button>
        ) : (
          <Button onClick={handleCreate} className="save" disabled={loading}>
            {loading ? (
              <Spinner as="span" animation="border" size="sm" role="status" />
            ) : (
              "Создать"
            )}
          </Button>
        )}
        <Button variant="secondary" onClick={handleModalWithoutChanges} disabled={loading}>
          Отмена
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default TaskModal;
