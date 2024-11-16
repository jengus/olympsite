import React, { useState, useRef } from "react";
import { Card, Form, Button, ListGroup, Badge, ProgressBar, Spinner } from "react-bootstrap";
import ReactQuill from "react-quill";
import { useUserContext } from "../../context/UserContext";
import ErrorMessage from "../ErrorMessage";
import { notifyError, notifySuccess, notifyWarn } from "../Notification";

const AnswerForm = ({ answer, olymp, task, currentTime }) => {
  const [token] = useUserContext();
  const [id, setId] = useState(answer ? answer.id : "");
  const [content, setContent] = useState(answer ? answer.content : "");
  const [files, setFiles] = useState([]);
  const [existingAttachments, setExistingAttachments] = useState(answer ? answer.attachments : []);
  const [endDate, setEndDate] = useState(new Date(olymp.end_date + "Z"));
  const [is_answer, setIsAnswer] = useState(answer ? true : false);
  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef(null);
  const MAX_TOTAL_FILE_SIZE = 10 * 1024 * 1024;
  const MAX_TOTAL_FILES = 3;
  // const handleFileChange = (e) => {
  //   setFiles(e.target.files);
  // };
  const handleFileChange = (e) => {
    const selectedFiles = Array.from(e.target.files);
    const totalExistingFiles = existingAttachments.length;
    if (totalExistingFiles + selectedFiles.length > MAX_TOTAL_FILES) {
      const allowedFiles = MAX_TOTAL_FILES - totalExistingFiles;
      notifyWarn(
        `Превышено максимальное количество файлов (3). Вы можете добавить еще ${allowedFiles} файл(а).`
      );
      fileInputRef.current.value = null;
      return;
    }
    const totalExistingSize = existingAttachments.reduce(
      (sum, attachment) => sum + (attachment.file_size || 0),
      0
    );
    const totalSelectedSize = selectedFiles.reduce((sum, file) => sum + file.size, 0);
    const totalSize = totalExistingSize + totalSelectedSize;
    if (totalSize > MAX_TOTAL_FILE_SIZE) {
      const allowedSize = MAX_TOTAL_FILE_SIZE - totalExistingSize;
      notifyWarn(
        `Превышен лимит общего размера файлов (10 МБ). Вы можете загрузить еще до ${(
          allowedSize / (1024 * 1024)
        ).toFixed(2)} МБ.`
      );
      fileInputRef.current.value = null;
      return;
    }
  
    setFiles(selectedFiles);
  };
  const handleDeleteAttachment = (attachmentId) => {
    setExistingAttachments(existingAttachments.filter((att) => att.id !== attachmentId));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    
    setLoading(true);
    const formData = new FormData();
    formData.append("content", content || "");
    for (let i = 0; i < files.length; i++) {
      formData.append("files", files[i]);
    }
    existingAttachments.forEach((att) => {
      formData.append("remaining_files", att.id);
    });

    const xhr = new XMLHttpRequest();
    xhr.open(is_answer ? "PATCH" : "POST", `${process.env.REACT_APP_API_URL}/olymp/answer/${olymp.id}/${task.id}${is_answer ? `/${id}` : ""}`, true);
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
        const data = JSON.parse(xhr.responseText);
        setContent(data.content);
        setExistingAttachments(data.attachments);
        setFiles([]);
        setIsAnswer(true);
        setId(data.id);
        fileInputRef.current.value = null;
        notifySuccess("Ответ успешно сохранен");
      } else {
        const data = JSON.parse(xhr.responseText);
        notifyError("Ошибка сохранения ответа"+ data.detail);
      }
    };

    xhr.onerror = () => {
      setLoading(false);
      notifyError("Ошибка запроса сохранения ответа.");
    };

    xhr.send(formData);
  };

  if (currentTime > endDate) {
    return (
      <Card.Footer>
        <Form.Group controlId="formContent">
          <Form.Label>Ответ</Form.Label>
          <div className="view ql-editor" dangerouslySetInnerHTML={{ __html: content }} />
        </Form.Group>
        <Form.Group controlId="formAttachments">
          {existingAttachments.length > 0 && (
            <>
              <Form.Label>Файлы ответа</Form.Label>
              <ListGroup>
                {existingAttachments.map((attachment) => (
                  <ListGroup.Item key={attachment.id}>
                    <span>{attachment.filename}</span>
                  </ListGroup.Item>
                ))}
              </ListGroup>
            </>
          )}
        </Form.Group>
      </Card.Footer>
    );
  }

  return (
    <Card.Footer>
      <Form onSubmit={handleSubmit}>
        <Form.Group controlId="formContent">
          <Form.Label>Ответ</Form.Label>
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
                [{ list: "ordered" }, { list: "bullet" }, { indent: "-1" }, { indent: "+1" }],
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
        <Form.Group controlId="formFile" className="mb-3">
          <Form.Label>Выберите файлы к ответу</Form.Label>
          <Form.Control type="file" multiple onChange={handleFileChange} ref={fileInputRef} />
        </Form.Group>
        <Form.Group controlId="formAttachments">
          {existingAttachments.length > 0 && (
            <>
              <Form.Label>Файлы ответа</Form.Label>
              <ListGroup>
                {existingAttachments.map((attachment) => (
                  <ListGroup.Item key={attachment.id}>
                    <span>{attachment.filename}</span>
                    <Badge bg="danger" className="ms-3" onClick={() => handleDeleteAttachment(attachment.id)}>Удалить</Badge>
                  </ListGroup.Item>
                ))}
              </ListGroup>
            </>
          )}
          {loading && (
            <ProgressBar now={uploadProgress} label={`${Math.round(uploadProgress)}%`} />
          )}
          <Button className="mt-2" type="submit" disabled={loading}>
            {loading ? (
              <Spinner as="span" animation="border" size="sm" role="status" />
            ) : (
              "Сохранить"
            )}
          </Button>
        </Form.Group>
      </Form>
    </Card.Footer>
  );
};

export default AnswerForm;
