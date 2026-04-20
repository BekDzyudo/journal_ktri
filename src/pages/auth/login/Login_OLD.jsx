import React, { useContext, useRef } from "react";
import { useGlobalContext } from "../../../hooks/useGlobalContext";
import { Link, useNavigate } from "react-router-dom";
import { AuthContext } from "../../../context/AuthContext";
import { login } from "../../../components/authentication/auth";
import { toast } from "react-toastify";

function Login() {
  const { theme } = useGlobalContext();
  const email = useRef();
  const password = useRef();
  const regLoginForm = useRef();
  const navigate = useNavigate();
  const {login: handleLogin} = useContext(AuthContext);

  const addData = async (e) => {
    e.preventDefault();
    let dataObj = {
      email: email.current.value,
      password: password.current.value,
    };

    let errorArr = Object.keys(dataObj).filter((key) => {
      return !dataObj[key];
    });

    errorArr.forEach((item) => {
      document.getElementById(`${item}`).classList.add("border-red-600");
    });
    Array.from(regLoginForm.current).forEach((item) => {
      item.addEventListener("change", (e) => {
        if (e.target.value) {
          item.classList.remove("border-red-600");
        } else {
          item.classList.add("border-red-600");          
        }
      });
    });

    if (errorArr.length == 0) {
      const response = await login(dataObj);
      if (response) {
        handleLogin(response);
        toast.success("Xush kelibsiz");
        navigate("/");
      } else {
        toast.error("Email yoki Parol noto'g'ri");
      }
    }
  };

  return (
    <section className="flex justify-center items-center h-screen px-3.5 sm:px-5 w-full xl:w-full 2xl:w-11/12">
      <div className="flex flex-col items-center bg-base-300 border-base-200 px-3 py-10 w-full sm:w-[500px] md:w-[600px] rounded-box">
        <div className="flex flex-col items-center gap-3 sm:gap-4">
          <div className="w-20 sm:w-24">
            {theme == "night" ? (
              <img src="/new_logo_white.png" alt="" />
            ) : (
              <img src="/new_logo_blue.png" alt="" />
            )}
          </div>
          <h3 className="uppercase font-semibold text-sm sm:text-[16px]">
            Kasbiy ta'limni rivojlantirish instituti
          </h3>
          <h3 className="text-[16px] md:text-lg font-bold text-primary mb-3 sm:mb-5 uppercase">
            Tizimga kirish
          </h3>
        </div>
        <form action="" ref={regLoginForm} className="w-full md:w-[80%] sm:w-[90%]">
            <label className="label text-sm" htmlFor="email">
              Elektron pochta*
            </label>
            <input
              ref={email}
              id="email"
              name="email"
              type="email"
              className="input w-full mb-3 sm:mb-4 text-sm sm:text-lg outline-0 border"
              placeholder="Email"
            />

            <label className="label text-sm" htmlFor="password">
              Parol*
            </label>
            <input
              ref={password}
              id="password"
              type="password"
              className="input w-full text-sm sm:text-lg outline-0 border"
              placeholder="********"
            />

            <div className="flex flex-col items-center gap-3 mt-3 sm:mt-4">
              <div className="text-end w-full">
                <Link
                to="/confirm-email"
                  className={`${theme == "night" ? "text-neutral-300" : ""} text-sm sm:text-[16px] md:text-lg link font-semibold`}
                >
                  Parolni unutdingizmi?
                </Link>
              </div>
              <button className="btn btn-primary btn-sm sm:btn-md w-1/2 sm:w-1/3 mt-4 text-sm sm:text-lg" type="submit" onClick={addData}>
                Kirish
              </button>
              <Link
              to="/register"
                className={`${theme == "night" ? "text-neutral-400" : ""} text-sm link`}
              >
                Hisobingiz yo‘qmi? <span className="text-blue-500 opacity-100">Ro‘yxatdan o‘ting</span>
              </Link>
            </div>
        </form>
      </div>
    </section>
  );
}

export default Login;
