import React, { useState } from "react";
import Modal from "react-bootstrap/Modal";
import { Button, Form, Container, Spinner, InputGroup } from "react-bootstrap";
import ErrorMessage from "../ErrorMessage";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import { notifyError, notifySuccess } from "../Notification";


const RegisterModal = ({ olymp_id, active, handleModal }) => {
  const [errorMessage, setErrorMessage] = useState("");
  const [isTeamRegistration, setIsTeamRegistration] = useState(false);
  const [teamMembers, setTeamMembers] = useState([
    { name: "", lastname: "", surname: "" },
    { name: "", lastname: "", surname: "" },
  ]);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [lastname, setLastname] = useState("");
  const [surname, setSurname] = useState("");
  const [confirmationPassword, setConfirmationPassword] = useState("");
  const [name, setName] = useState("");
  const [organisation, setOrganisation] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});
  const [teamName, setTeamName] = useState("");
  const [teacher, setTeacher] = useState("");

  const clearForm = () => {
    setEmail("");
    setPassword("");
    setConfirmationPassword("");
    setName("");
    setTeamMembers([
      { name: "", lastname: "", surname: "" },
      { name: "", lastname: "", surname: "" },
    ]);
    setErrorMessage("");
    setOrganisation("");
    setLastname("");
    setSurname("");
    setLoading(false);
    setShowConfirmPassword(false);
    setShowPassword(false);
    setFieldErrors({});
    setTeamName("");
    setTeacher("");
  };

  const closeForm = () => {
    handleModal();
    clearForm();
  };

  const toggleRegistrationType = () => {
    setIsTeamRegistration(!isTeamRegistration);
    clearForm();
  };

  const addTeamMember = () => {
    if (teamMembers.length < 5) {
      setTeamMembers([...teamMembers, { name: "", lastname: "", surname: "" }]);
    }
  };

  const removeTeamMember = (index) => {
    if (teamMembers.length > 2) {
      setTeamMembers(teamMembers.filter((_, i) => i !== index));
    }
  };

  const handleTeamMemberChange = (index, field, value) => {
    const newTeamMembers = [...teamMembers];
    newTeamMembers[index][field] = value;
    setTeamMembers(newTeamMembers);
  };
  const validatePassword = (password, confirmationPassword) => {
    const minLength = 8;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSpaces = /\s/.test(password);

    if (password.length < minLength) {
      return "Пароль должен содержать минимум 8 символов";
    } else if (!hasUpperCase) {
      return "Пароль должен содержать минимум одну заглавную букву";
    } else if (!hasLowerCase) {
      return "Пароль должен содержать минимум одну строчную букву";
    } else if (!hasNumbers) {
      return "Пароль должен содержать минимум одну цифру";
    } else if (hasSpaces) {
      return "Пароль не должен содержать пробелы";
    } else if (password !== confirmationPassword) {
      return "Пароли не совпадают";
    } else {
      return "";
    }
  };
  const validateTeacher = (teacher) => {
    const teacherPattern = /^[А-ЯЁ][а-яё]+(-[А-ЯЁ][а-яё]+)?\s[А-ЯЁ][а-яё]+\s[А-ЯЁ][а-яё]+$/;
    return teacherPattern.test(teacher) ? "": "Введите корректно";
  }
  const validateEmail = (email) => {
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailPattern.test(email) ? "" : "Введите корректный email";
  };

  const validateNameField = (value) => {
    const regex = /^[а-яА-ЯёЁ\-]+$/;
    if (!value) return "Поле обязательно";
    if (/\s/.test(value)) return "Поле не должно содержать пробелы";
    if (!regex.test(value))
      return `Поле может содержать только русские буквы и тире`;
    if (value[0] !== value[0].toUpperCase())
      return `Поле должно начинаться с заглавной буквы`;
    return "";
  };

  const validateFields = () => {
    const errors = {};

    const emailError = validateEmail(email);
    if (emailError) errors.email = emailError;

    const teacherError = validateTeacher(teacher);
      if (teacherError) errors.teacher = teacherError;

    const passwordError = validatePassword(password, confirmationPassword);
    if (passwordError) errors.password = passwordError;

    if (!isTeamRegistration) {
    if (!name) {
      errors.name = "Имя обязательно";
    } else {
      const nameError = validateNameField(name);
      if (nameError) errors.name = nameError;
    }

    if (!lastname) {
      errors.lastname = "Фамилия обязательна";
    } else if (!isTeamRegistration) {
      const lastnameError = validateNameField(lastname);
      if (lastnameError) errors.lastname = lastnameError;
    }

    if (!surname) {
      errors.surname = "Отчество обязательно";
    } else if (!isTeamRegistration) {
      const surnameError = validateNameField(surname);
      if (surnameError) errors.surname = surnameError;
    }
    }


    if (!organisation) errors.organisation = "Организация обязательна";
    if (isTeamRegistration && !teamName)
      errors.teamName = "Название команды обязательно";
    if (isTeamRegistration) {
      teamMembers.forEach((member, index) => {
        if (!member.name) {
          errors[`memberName${index}`] = "Имя члена команды обязательно";
        } else {
          const memberNameError = validateNameField(member.name);
          if (memberNameError) errors[`memberName${index}`] = memberNameError;
        }

        if (!member.lastname) {
          errors[`memberLastname${index}`] =
            "Фамилия члена команды обязательна";
        } else {
          const memberLastnameError = validateNameField(member.lastname);
          if (memberLastnameError)
            errors[`memberLastname${index}`] = memberLastnameError;
        }

        if (!member.surname) {
          errors[`memberSurname${index}`] =
            "Отчество члена команды обязательно";
        } else {
          const memberSurnameError = validateNameField(member.surname);
          if (memberSurnameError)
            errors[`memberSurname${index}`] = memberSurnameError;
        }
      });
    }
    return errors;
  };

  const handleRegister = async () => {
    setLoading(true);
    const errors = validateFields();
    if (Object.keys(errors).length > 0) {
      notifyError("Ошибки заполнения.")
      setFieldErrors(errors);
      setLoading(false);
      return;
    }
    setErrorMessage("");
    setFieldErrors({});

    const requestOptions = {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: email.toLowerCase(),
        password: password,
        name: isTeamRegistration ? teamName : name,
        organisation: organisation,
        teacher: teacher,
        olymp_id: olymp_id,
        lastname: isTeamRegistration ? undefined : lastname,
        surname: isTeamRegistration ? undefined : surname,
        members: isTeamRegistration ? teamMembers : undefined,
      }),
    };

    const endpoint = isTeamRegistration
      ? `${process.env.REACT_APP_API_URL}/customusers/teamregister`
      : `${process.env.REACT_APP_API_URL}/customusers/register`;
    try {
      const response = await fetch(endpoint, requestOptions);

      if (!response.ok) {
        const data = await response.json();
        notifyError(data.detail || "Ошибка регистрации");
        setErrorMessage(data.detail || "Ошибка регистрации");
      } else {
        handleModal();
        clearForm();
        notifySuccess("Успешная регистрация!");
      }
    } catch (error) {
      notifyError("Ошибка запроса")
      setErrorMessage("Ошибка запроса")
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal show={active} onHide={closeForm}>
      <Modal.Header className="d-flex flex-column align-items-center">
        <Modal.Title>
          {isTeamRegistration ? "Командная регистрация" : "Личная регистрация"}
        </Modal.Title>
        <Form className="mt-2">
          {isTeamRegistration ? (
            <p>
              Регистрируетесь лично?
              <Button variant="link" onClick={toggleRegistrationType}>
                Личная регистрация
              </Button>
            </p>
          ) : (
            <p>
              Регистрируете команду?
              <Button variant="link" onClick={toggleRegistrationType}>
                Командная регистрация
              </Button>
            </p>
          )}
        </Form>
      </Modal.Header>
      <Modal.Body>
        <Form>
          {!isTeamRegistration ? (
            <>
              <Form.Group>
                <Form.Label>Фамилия</Form.Label>
                <Form.Control
                  type="text"
                  placeholder="Введите фамилию"
                  value={lastname}
                  onChange={(e) => setLastname(e.target.value)}
                  isInvalid={!!fieldErrors.lastname}
                />
                <Form.Control.Feedback type="invalid">
                  {fieldErrors.lastname}
                </Form.Control.Feedback>
              </Form.Group>
              <Form.Group>
                <Form.Label>Имя</Form.Label>
                <Form.Control
                  placeholder="Введите имя"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  isInvalid={!!fieldErrors.name}
                />
                <Form.Control.Feedback type="invalid">
                  {fieldErrors.name}
                </Form.Control.Feedback>
              </Form.Group>
              <Form.Group>
                <Form.Label>Отчество</Form.Label>
                <Form.Control
                  placeholder="Введите отчество"
                  value={surname}
                  onChange={(e) => setSurname(e.target.value)}
                  isInvalid={!!fieldErrors.surname}
                />
                <Form.Control.Feedback type="invalid">
                  {fieldErrors.surname}
                </Form.Control.Feedback>
              </Form.Group>
            </>
          ) : (
            <>
              <Form.Group>
                <Form.Label>Название команды</Form.Label>
                <Form.Control
                  placeholder="Введите название команды"
                  value={teamName}
                  onChange={(e) => setTeamName(e.target.value)}
                  isInvalid={!!fieldErrors.teamName}
                />
                <Form.Control.Feedback type="invalid">
                  {fieldErrors.teamName}
                </Form.Control.Feedback>
              </Form.Group>
              <Form.Group>
                <Form.Label>Члены команды</Form.Label>
                {teamMembers.map((member, index) => (
                  <div key={index} className="mb-2">
                    <Form.Control
                      placeholder={`Фамилия члена команды ${index + 1}`}
                      value={member.lastname}
                      onChange={(e) =>
                        handleTeamMemberChange(
                          index,
                          "lastname",
                          e.target.value
                        )
                      }
                      className="mb-1"
                      isInvalid={!!fieldErrors[`memberLastname${index}`]}
                    />
                    <Form.Control.Feedback type="invalid">
                      {fieldErrors[`memberLastname${index}`]}
                    </Form.Control.Feedback>
                    <Form.Control
                      placeholder={`Имя члена команды ${index + 1}`}
                      value={member.name}
                      onChange={(e) =>
                        handleTeamMemberChange(index, "name", e.target.value)
                      }
                      className="mb-1"
                      isInvalid={!!fieldErrors[`memberName${index}`]}
                    />
                    <Form.Control.Feedback type="invalid">
                      {fieldErrors[`memberName${index}`]}
                    </Form.Control.Feedback>
                    <Form.Control
                      placeholder={`Отчество члена команды ${index + 1}`}
                      value={member.surname}
                      onChange={(e) =>
                        handleTeamMemberChange(index, "surname", e.target.value)
                      }
                      isInvalid={!!fieldErrors[`memberSurname${index}`]}
                    />
                    <Form.Control.Feedback type="invalid">
                      {fieldErrors[`memberSurname${index}`]}
                    </Form.Control.Feedback>
                    {teamMembers.length > 2 && (
                      <Button
                        variant="danger"
                        onClick={() => removeTeamMember(index)}
                        className="mt-1"
                      >
                        Удалить
                      </Button>
                    )}
                  </div>
                ))}
                {teamMembers.length < 3 && (
                  <Container className="d-flex justify-content-center mt-2">
                    <Button onClick={addTeamMember}>
                      Добавить члена команды
                    </Button>
                  </Container>
                )}
              </Form.Group>
            </>
          )}
          <Form.Group>
          <Form.Group>
              <Form.Label>Руководитель</Form.Label>
              <Form.Control
                placeholder="Фамилия Имя Отчество"
                value={teacher}
                onChange={(e) => setTeacher(e.target.value)}
                isInvalid={!!fieldErrors.teacher}
              />
              <Form.Control.Feedback type="invalid">
                {fieldErrors.teacher}
              </Form.Control.Feedback>
            </Form.Group>
            <Form.Label>Организация</Form.Label>
            <Form.Control
              placeholder="Введите организацию"
              value={organisation}
              onChange={(e) => setOrganisation(e.target.value)}
              isInvalid={!!fieldErrors.organisation}
            />
            <Form.Control.Feedback type="invalid">
              {fieldErrors.organisation}
            </Form.Control.Feedback>
          </Form.Group>
          <Form.Group>
            <Form.Label>Email</Form.Label>
            <Form.Control
              type="email"
              placeholder="Введите email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              isInvalid={!!fieldErrors.email}
            />
            <Form.Control.Feedback type="invalid">
              {fieldErrors.email}
            </Form.Control.Feedback>
          </Form.Group>
          <Form.Group className="mt-2">
            <Form.Label>Пароль</Form.Label>
            <InputGroup>
              <Form.Control
                type={showPassword ? "text" : "password"}
                placeholder="Введите пароль"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                isInvalid={!!fieldErrors.password}
              />
              <Button onClick={() => setShowPassword(!showPassword)}>
                {showPassword ? <FaEyeSlash /> : <FaEye />}
              </Button>
              <Form.Control.Feedback type="invalid">
                {fieldErrors.password}
              </Form.Control.Feedback>
            </InputGroup>
          </Form.Group>
          <Form.Group className="mt-2">
            <Form.Label>Подтверждение пароля</Form.Label>
            <InputGroup>
              <Form.Control
                type={showConfirmPassword ? "text" : "password"}
                placeholder="Подтвердите пароль"
                value={confirmationPassword}
                onChange={(e) => setConfirmationPassword(e.target.value)}
                required
                isInvalid={!!fieldErrors.confirmationPassword}
              />
              <Button
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              >
                {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
              </Button>
              <Form.Control.Feedback type="invalid">
                {fieldErrors.confirmationPassword}
              </Form.Control.Feedback>
            </InputGroup>
          </Form.Group>
          <ErrorMessage message={errorMessage} />
        </Form>
      </Modal.Body>
      <Modal.Footer className="d-flex justify-content-center">
        <Button onClick={handleRegister} disabled={loading}>
          {loading ? <Spinner animation="border" size="sm" /> : "Регистрация"}
        </Button>
        <Button variant="secondary" onClick={closeForm}>
          Закрыть
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default RegisterModal;