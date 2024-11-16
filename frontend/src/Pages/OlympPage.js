import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Container, Spinner } from "react-bootstrap";
import { useUserContext } from "../context/UserContext";
import Olymp from "../components/Olymp/Olymp";
import Loading from "../components/Loading";

const OlympPage = () => {
  const { id } = useParams();
  const [token, , user] = useUserContext();
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const checkIdAndNavigate = async () => {
        if (!token) {
          navigate("/");
        } else if (user) {
          if (user.role_id === 2 || user.role_id === 3) {
            navigate(`/edit-olymp/${id}`);
          } else if (user.role_id === 5 || user.role_id === 6){
            setLoading(true);
          } else {
            navigate("/");
          }
        }
    };
    checkIdAndNavigate();
  }, [id, token, user, navigate]);

  return (
    <>
      {loading ? (<Olymp />) : (<Loading/>)}
    </>
  );
};

export default OlympPage;
