import React, { useState, useEffect } from 'react';
import OlympPreview from '../components/Olymp/OlympPreview';
import { useUserContext} from '../context/UserContext';
import Loading from '../components/Loading';
import { useNavigate} from "react-router-dom";
import CheckOlymp from '../components/Olymp/CheckOlymp';


const CheckPage = () => {
    const [token, , user] = useUserContext();
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();
    useEffect(() => {
        const checkIdAndNavigate = async () => {
            if (!token) {
              navigate("/");
            } else if (user) {
              if (user.role_id !== 3 && user.role_id !== 4) {
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
        {loading ? (<CheckOlymp/>) : (<Loading/>)}
        </>
    );
};

export default CheckPage;