import React, { useRef } from 'react'
import { useGlobalContext } from '../../../hooks/useGlobalContext';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';

function NewPassword() {

    const { theme } = useGlobalContext();
    const email = useRef()
    const password = useRef()
    const parolTiklashForm = useRef()
    const navigate = useNavigate()

     function addData(e){
        e.preventDefault()
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
            Array.from(parolTiklashForm.current).forEach((item) => {
              item.addEventListener("change", (e) => {
                if (e.target.value) {
                  item.classList.remove("border-red-600");
                } else {
                  item.classList.add("border-red-600");
                }
              });
            });

            if (errorArr.length == 0) {
                  fetch(`${import.meta.env.VITE_BASE_URL}/password-reset/`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(dataObj),
                  })
                    .then(async(res) => {
                      const errorObj = await res.json()
                      if (!res.ok) throw new Error(JSON.stringify(errorObj));
                      return res;
                    })
                    .then((data) => {
                      parolTiklashForm.current.reset();
                      toast.success("Parol o'zgartirildi 👍")
                      navigate("/login")
                    })
                    .catch((err) => {
                      const errorObj = JSON.parse(err.message)
                        let errNewParolText = errorObj?.error?.join(" ")
                        toast.error(errNewParolText && errNewParolText)
                    })
                    .finally(() => {
                    //   saveMalumot.innerHTML = "Saqlash";
                    });
          
            //       saveMalumot.innerHTML = `<button className="btn btn-primary btn-sm sm:btn-md w-1/2 sm:w-1/3 mt-4 text-sm sm:text-lg" type="submit" id="saveMalumot">
            //     <span className="loading loading-ring loading-xs"></span>
            //   </button>`;
              }
    }

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
          <h3 className="text-[16px] md:text-lg font-bold text-primary mb-3 sm:mb-5">
            Elektron pochtangizni tasdiqlang va yangi parol yarating
          </h3>
        </div>
        <form action="" ref={parolTiklashForm} className="w-full md:w-[80%] sm:w-[90%]">
            <label className="label text-sm" htmlFor="email">
              Elektron pochta*
            </label>
            <input
              ref={email}
              id="email"
              name="email"
              type="email"
              className="input w-full mb-3 sm:mb-4 text-sm sm:text-lg outline-0 border"
              placeholder="example@gmail.com"
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

            <div className="flex flex-col items-center gap-3 mt-3 sm:mt-6">
              <button className="btn btn-primary btn-sm sm:btn-md w-1/2 sm:w-1/3 mt-4 text-sm sm:text-lg" type="submit" id="saveMalumot" onClick={addData}>
                Saqlash
              </button>
              <Link
              to="/login"
                className={`${theme == "night" ? "text-neutral-400" : ""} text-sm link`}
              >
                Kirish sahifasiga o‘tish
              </Link>
            </div>
        </form>
      </div>
    </section>
  )
}

export default NewPassword