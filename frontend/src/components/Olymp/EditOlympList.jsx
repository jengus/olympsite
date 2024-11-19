import React, {  useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Button,
  Row,
  Col,
  Container,
  Spinner,
  ButtonGroup,
} from "react-bootstrap";
import { useUserContext } from "../../context/UserContext";
import Loading from "../Loading";
import { notifyError, notifySuccess } from "../Notification";



const EditOlympList = ({onClose}) => {
  const [token] = useUserContext();
  const [olymps, setOlymps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [buttonLoading, setButtonLoading] = useState({});
  const navigate = useNavigate();


  const fetchOlymps = async () => {
    const requestOptions = {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + token,
      },
    };
    try {
      const response = await fetch(
        `${process.env.REACT_APP_API_URL}/olymp/all`,
        requestOptions
      );
      const data = await response.json();
      if (response.ok) {
        setOlymps(data);
      } else {
        console.error("Failed to fetch olyms ", data.detail);
        notifyError("Ошибка загрузки олимпиад ", data.detail);
      }
    } catch (error) {
      console.error("Error fetching olymps ", error);
      notifyError("Ошибка запроса получения олимпиад");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOlymps();
  }, []);

  // const handleCreate = async () => {
  //   setButtonLoading((prev) => ({ ...prev, create: true }));
  //   const requestOptions = {
  //     method: "POST",
  //     headers: {
  //       "Content-Type": "application/json",
  //       Authorization: "Bearer " + token,
  //     },
  //     body: JSON.stringify({
  //       name: "Без названия",
  //       description: "",
  //       start_date: date.toISOString(),
  //       end_date: date.toISOString(),
  //     }),
  //   };
  //   try {
  //     const response = await fetch(
  //       "${process.env.REACT_APP_API_URL}/olymp/create",
  //       requestOptions
  //     );
  //     const data = await response.json();
  //     if (response.ok) {
  //       navigate(`/edit-olymp/${data.id}`);
  //     } else {
  //       console.error("Failed to create olymp ", data.detail);
  //       notifyError("Ошибка создания олимпиады ", data.detail);
  //     }
  //   } catch (error) {
  //     console.error("Failed to create olymp", error);
  //     notifyError("Ошибка запроса");
  //   } finally {
  //     setButtonLoading((prev) => ({ ...prev, create: false }));
  //   }
  // };

  const handleEdit = (id) => {
    navigate(`/edit-olymp/${id}`);
    if (onClose) {
      onClose();
    }
  };
  const handleRaiting = (id) => {
    navigate(`/inraiting/${id}`);
    if (onClose) {
      onClose();
    }
  };

  const handleDelete = async (id) => {
    setButtonLoading((prev) => ({ ...prev, [id]: true }));
    const requestOptions = {
      method: "DELETE",
      headers: {
        "Content-type": "application/json",
        Authorization: "Bearer " + token,
      },
    };
    try {
      const response = await fetch(
        `${process.env.REACT_APP_API_URL}/olymp/${id}`,
        requestOptions
      );
      if (!response.ok) {
        const data = await response.json();
        console.error("Failed to delete olymp", data.detail);
        notifyError("Ошибка удаления олимпиады ", data.detail);
      } else {
        notifySuccess("Успешное удаление");
        fetchOlymps();
      }
    } catch (error) {
      console.error("Failed to delete olymp", error);
      notifyError("Ошибка запроса удаления олимпиады");
    } finally {
      setButtonLoading((prev) => ({ ...prev, [id]: false }));
    }
  };

  const handlePublishOrNot = async (id, is_active) => {
    setButtonLoading((prev) => ({ ...prev, [id]: true }));
    const requestOptions = {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + token,
      },
      body: JSON.stringify({
        is_active: is_active,
      }),
    };
    try {
      const response = await fetch(
        `${process.env.REACT_APP_API_URL}/olymp/${id}`,
        requestOptions
      );
      if (response.ok) {
        if (is_active) 
        {notifySuccess("Успешная публикация");} 
        else {notifySuccess("Успешное снятие публикации")}
        fetchOlymps();
      } else {
        const data = await response.json();
        console.error("Failed to delete olymp", data.detail);
        notifyError("Ошибка обновления состояния публикации ", data.detail);
      }
    } catch (error) {
      console.error("Failed to update olymp", error);
      notifyError("Ошибка запроса обновления состояния публикации");
    } finally {
      setButtonLoading((prev) => ({ ...prev, [id]: false }));
    }
  };

  const handlePublish = async (id) => {
    const publishedCount = olymps.filter((olymp) => olymp.is_active).length;
    if (publishedCount === 1) {
      notifyError("Может быть опубликована только одна олимпиада.");
      return;
    } else {
      handlePublishOrNot(id, true);
    }
  };

  const handleDePublish = async (id) => {
    handlePublishOrNot(id, false);
  };

  if (loading) {
    return <Loading />;
  }

  return (
    <>
          {olymps.map((olymp) => (
            <Container key={olymp.id} className="bg-light border rounded border-dark p-2 px-3 mb-2">
              <Row style={{ fontWeight: "bold" }}>{olymp.name}</Row>
              <Row>
                  <Col>
                  <Row>
                    Дата начала:{" "}
                    {new Date(olymp.start_date + "Z").toLocaleString()}
                  </Row>
                  <Row>
                    Дата конца:{" "}
                    {new Date(olymp.end_date + "Z").toLocaleString()}
                  </Row>
                  <Row>
                    Количество участников: {olymp.count}
                  </Row>
                  </Col>
                  <Col>
                  <ButtonGroup>
                  {olymp.is_active ? (
                    <Button
                      className="m-0"
                      variant="danger"
                      onClick={() => handleDePublish(olymp.id)}
                      disabled={buttonLoading[olymp.id]}
                    >
                      {buttonLoading[olymp.id] ? <Spinner animation="border" size="sm" /> : "Опубликовано"}
                    </Button>
                  ) : (
                    <Button
                      className="m-0"
                      onClick={() => handlePublish(olymp.id)}
                      disabled={buttonLoading[olymp.id]}
                    >
                      {buttonLoading[olymp.id] ? <Spinner animation="border" size="sm" /> : "Опубликовать"}
                    </Button>
                  )}

                <Button
                    className="m-0"
                    onClick={() => handleRaiting(olymp.id)}
                    disabled={buttonLoading[olymp.id]}
                  >
                    Рейтинг
                  </Button>

                  <Button
                    className="m-0"
                    onClick={() => handleEdit(olymp.id)}
                    disabled={buttonLoading[olymp.id]}
                  >
                    Редактировать
                  </Button>

                  <Button
                    variant="danger"
                    className="m-0"
                    onClick={() => handleDelete(olymp.id)}
                    disabled={buttonLoading[olymp.id]}
                  >
                    {buttonLoading[olymp.id] ? <Spinner animation="border" size="sm" /> : "Удалить"}
                  </Button>
                  </ButtonGroup>
                  </Col>
              </Row>
              
            </Container>
          ))}       
    </>
  );
};

export default EditOlympList;
