import React, { useState, useEffect } from 'react';
import OlympPreview from '../components/Olymp/OlympPreview';
import { useUserContext} from '../context/UserContext';
import Loading from '../components/Loading';
import { useNavigate} from "react-router-dom";


const Preview = () => {
    const [token, , user] = useUserContext();
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();
    useEffect(() => {
        const checkIdAndNavigate = async () => {
            if (!token) {
              navigate("/");
            } else if (user) {
              if (user.role_id !== 2 && user.role_id !== 3) {
                navigate("/");
              } else {
                setLoading(true);
              }
            }
        };
        checkIdAndNavigate();
      }, [token, user, navigate]);
    return (
        <>
        {loading ? (<OlympPreview/>) : (<Loading/>)}
        </>
    );
};

export default Preview;