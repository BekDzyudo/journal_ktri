import React, { useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { useGlobalContext } from "../../../hooks/useGlobalContext";

function Register() {
  const { theme } = useGlobalContext();

  const regStudentForm = useRef();
  const firstName = useRef()
  const lastName = useRef()
  const email = useRef();
  const image = useRef();
  const password = useRef();
  const confirmPassword = useRef();
  const navigate = useNavigate()

   function addData(e) {
    e.preventDefault()
    let dataObj = {
      first_name: firstName.current.value,
      last_name: lastName.current.value,
      email: email.current.value,
      image: image.current.files[0],
      password: password.current.value,
      password2: confirmPassword.current.value,
    };
    
    let errorArr = Object.keys(dataObj).filter((key) => {
      return !dataObj[key];
    });

      errorArr.forEach((item) => {
        document.getElementById(`${item}`).classList.add("border-red-600");
      });
      Array.from(regStudentForm.current).forEach((item) => {
        item.addEventListener("change", (e) => {
          if (e.target.value) {
            item.classList.remove("border-red-600");
          } else {
            item.classList.add("border-red-600");
          }
        });
      });

      const formData = new FormData();
      if (errorArr.length == 0) {
        formData.append("first_name", dataObj.first_name);
        formData.append("last_name", dataObj.last_name);
        formData.append("email", dataObj.email);
        formData.append("image", dataObj.image, dataObj.image.name);
        formData.append("password", dataObj.password);
        formData.append("password2", dataObj.password2);
        formData.append("user_roles", "ordinary_user");

        if (dataObj.password !== dataObj.password2) {
          toast.error("Parolni qayta tekshiring")
        }
         else {
          fetch(`${import.meta.env.VITE_BASE_URL}/register/ordinary/`, {
            method: "POST",
            body: formData
          })
            .then(async(res) => {
              const errorObj = await res.json()
              if (!res.ok) throw new Error(JSON.stringify(errorObj));
              return res;
            })
            .then((data) => {
              regStudentForm.current.reset();
              toast.success("Muvaffaqiyatli")
              navigate("/login")
            })
            .catch((err) => {
              const errorObj = JSON.parse(err.message)
              let errPasswText = errorObj?.password?.join(" ")
              let errEmailText = errorObj?.email?.join(" ")
              
              toast.error(errEmailText && errEmailText)
              toast.error( errPasswText && errPasswText)
              
            })
            .finally(() => {
            //   saveMalumot.innerHTML = "Ro‘yxatdan o‘tish";
            });
  
        //   saveMalumot.innerHTML = `<div style="width: 20px; height: 20px; margin-top:5px;"  class="spinner-border text-light" role="status">
        //       <span class="visually-hidden">Loading...</span>
        //        </div>`;
        }
      }
  }

  return (
    <section className="flex justify-center items-center h-screen px-3.5 sm:px-5 w-full xl:w-full 2xl:w-11/12">
      <div className="flex flex-col items-center bg-base-300 border-base-200 px-3 py-10 w-full sm:w-[500px] md:w-[800px] rounded-box">
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
            Ro‘yxatdan o‘tish
          </h3>
        </div>
        <form
          action=""
          ref={regStudentForm}
          className="w-full sm:w-[95%]"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-5">
            <div>
              <label className="label text-sm" htmlFor="first_name">
                Ism*
              </label>
              <input
                ref={firstName}
                id="first_name"
                name="first_name"
                type="text"
                className="input w-full text-sm sm:text-lg outline-0 border"
                placeholder=""
              />
            </div>
            <div>
              <label className="label text-sm" htmlFor="last_name">
                Familya*
              </label>
              <input
                ref={lastName}
                id="last_name"
                name="last_name"
                type="text"
                className="input w-full text-sm sm:text-lg outline-0 border"
                placeholder=""
              />
            </div>
             <div>
              <label className="label text-sm" htmlFor="email">
                Elektron pochta*
              </label>
              <input
                ref={email}
                id="email"
                name="email"
                type="email"
                className="input w-full text-sm sm:text-lg outline-0 border"
                placeholder=""
              />
            </div>
             <div>
              <label className="label text-sm" htmlFor="image">
                Rasm joylash*
              </label>
              <input
                ref={image}
                id="image"
                name="image"
                type="file"
                className="file-input w-full text-sm outline-0 border"
                placeholder=""
              />
            </div>
             <div>
              <label className="label text-sm" htmlFor="password">
                Parol*
              </label>
              <input
                ref={password}
                id="password"
                name="password"
                type="password"
                className="input w-full text-sm sm:text-lg outline-0 border"
                placeholder="********"
              />
            </div>
             <div>
              <label className="label text-sm" htmlFor="password2">
                Parolni takrorlang*
              </label>
              <input
                ref={confirmPassword}
                id="password2"
                name="password2"
                type="password"
                className="input w-full text-sm sm:text-lg outline-0 border"
                placeholder="********"
              />
            </div>
          </div>

          <div className="flex flex-col items-center gap-3 mt-3 sm:mt-6">
            <button
              className="btn btn-primary btn-sm sm:btn-md w-1/2 md:w-1/3 mt-4 text-sm sm:text-lg"
              id="saveMalumot"
              type="submit"
              onClick={addData}
            >
              Ro‘yxatdan o‘tish
            </button>
            <Link
            to="/login"
              className={`${theme == "night" ? "text-neutral-400" : ""} text-sm link`}
            >
              Avval ro‘yxatdan o‘tganmisiz? Kirish
            </Link>
          </div>
        </form>
      </div>
    </section>
  );
}

export default Register;
