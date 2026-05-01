import React, { useState, useContext } from 'react'
import { useNavigate } from 'react-router-dom'
import { FaPaperPlane, FaUser, FaEnvelope, FaPhone, FaFileUpload, FaCheckCircle, FaBook, FaTimes, FaFilePdf } from 'react-icons/fa'
import { toast } from 'react-toastify'
import { AuthContext } from '../../context/AuthContext'
import SEO from '../../components/SEO'
import { getAccessToken } from '../../utils/authStorage'
import { parseApiError } from '../../utils/apiError'

const INITIAL_FORM_DATA = {
  fullName: '',
  email: '',
  gender: '',
  workplace: '',
  position: '',
  category: '',
  phone: '',
  articleTitle: '',
  keywords: '',
  annotation: '',
  bibliography: '',
  acceptTerms: false
}

const CATEGORIES = [
  'Umumiy pedagogika, pedagogika tarixi va ta\'lim',
  'Ta\'lim va tarbiya nazariyasi va metodikasi',
  'Inklyuziv ta\'lim',
  'Xalqaro tadqiqotlar',
  'Maktab ta\'limini tashkil etish',
  'Malaka oshirish va qayta tayyorlash',
  'Ta\'lim menejmenti va boshqaruv',
  'Ustoz-shogird',
  'Kasbga yo\'naltirish',
  'Psixologik xizmat',
  'Ta\'lim uzluksizligi va islohotlar'
]

function SendJournal() {
  const { auth, userData } = useContext(AuthContext)
  const navigate = useNavigate()
  const [formData, setFormData] = useState(INITIAL_FORM_DATA)
  const [coAuthors, setCoAuthors] = useState([''])
  const [file, setFile] = useState(null)
  const [errors, setErrors] = useState({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showModal, setShowModal] = useState(false)

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }))
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }))
    }
  }

  const handleCoAuthorChange = (index, value) => {
    setCoAuthors((prev) => prev.map((author, idx) => (idx === index ? value : author)))
    if (errors.authorNames) {
      setErrors((prev) => ({ ...prev, authorNames: '' }))
    }
  }

  const addCoAuthor = () => {
    setCoAuthors((prev) => [...prev, ''])
  }

  const removeCoAuthor = (index) => {
    setCoAuthors((prev) => {
      const next = prev.filter((_, idx) => idx !== index)
      return next.length ? next : ['']
    })
  }

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0]
    if (selectedFile) {
      const fileExtension = selectedFile.name.split('.').pop().toLowerCase()
      if (fileExtension === 'pdf') {
        setFile(selectedFile)
        if (errors.file) {
          setErrors(prev => ({ ...prev, file: '' }))
        }
      } else {
        setErrors(prev => ({ ...prev, file: 'Faqat .pdf formatdagi faylni yuklash mumkin' }))
        e.target.value = null
      }
    }
  }

  const removeFile = () => {
    setFile(null)
    document.getElementById('fileInput').value = null
  }

  const validateForm = () => {
    const newErrors = {}
    const normalizedCoAuthors = coAuthors.map((author) => author.trim()).filter(Boolean)
    
    if (!formData.fullName.trim()) newErrors.fullName = 'FISH ni kiriting'
    if (!formData.email.trim()) {
      newErrors.email = 'Elektron pochtani kiriting'
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Noto\'g\'ri elektron pochta formati'
    }
    if (!normalizedCoAuthors.length) newErrors.authorNames = 'Kamida bitta hammuallif F.I.Sh ni kiriting'
    if (!formData.gender) newErrors.gender = 'Jinsni tanlang'
    if (!formData.workplace.trim()) newErrors.workplace = 'Ish joyini kiriting'
    if (!formData.position.trim()) newErrors.position = 'Lavozimni kiriting'
    if (!formData.category) newErrors.category = 'Ruknni tanlang'
    if (!formData.phone.trim()) newErrors.phone = 'Telefon raqamini kiriting'
    if (!formData.articleTitle.trim()) newErrors.articleTitle = 'Maqola nomini kiriting'
    if (!formData.keywords.trim()) newErrors.keywords = 'Kalit so\'zlarni kiriting'
    if (!formData.annotation.trim()) newErrors.annotation = 'Annotatsiyani kiriting'
    if (!formData.bibliography.trim()) newErrors.bibliography = 'Adabiyotlar ro\'yxatini kiriting'
    if (!file) newErrors.file = 'Maqola faylini yuklang'
    if (!formData.acceptTerms) newErrors.acceptTerms = 'Oferta shartlarini qabul qilishingiz kerak'

    setErrors(newErrors)
    return newErrors
  }

  const scrollToFirstError = (errors) => {
    const errorFields = Object.keys(errors)
    if (errorFields.length > 0) {
      const firstErrorField = errorFields[0]
      const element = document.querySelector(`[name="${firstErrorField}"]`) || document.getElementById('fileInput')
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' })
        element.focus()
      }
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    const validationErrors = validateForm()
    if (Object.keys(validationErrors).length > 0) {
      // Validatsiya xatosi haqida toast ko'rsatish
      const errorCount = Object.keys(validationErrors).length
      toast.error(`Iltimos, ${errorCount} ta bo'sh maydonni to'ldiring!`, {
        position: 'top-center',
        autoClose: 5000,
      })
      
      // Birinchi xatoga scroll qilish
      scrollToFirstError(validationErrors)
      return
    }

    setIsSubmitting(true)

    try {
      // Form submission logic
      const formDataToSend = new FormData()
      Object.keys(formData).forEach(key => {
        formDataToSend.append(key, formData[key])
      })
      const authorNames = coAuthors.map((author) => author.trim()).filter(Boolean).join(', ')
      formDataToSend.append('authorNames', authorNames)
      if (file) {
        formDataToSend.append('articleFile', file)
        formDataToSend.append('fileName', file.name)
      }

      // Foydalanuvchi ma'lumotlarini qo'shish
      if (auth && userData) {
        formDataToSend.append('userId', userData.id || userData.email)
      }

      const accessToken = getAccessToken()
      const response = await fetch(`${import.meta.env.VITE_BASE_URL}/maqola-yuborish/`, {
        method: 'POST',
        headers: accessToken ? {
          'Authorization': 'Bearer ' + accessToken,
        } : {},
        body: formDataToSend
      })

      const data = await response.json().catch(() => ({}))

      if (response.ok) {
        toast.success('Maqola muvaffaqiyatli yuborildi!', {
          position: 'top-center',
          autoClose: 3000,
        })

        setFormData(INITIAL_FORM_DATA)
        setCoAuthors([''])
        setFile(null)
        document.getElementById('fileInput').value = null
        navigate('/admin')
      } else {
        throw new Error(parseApiError(data, 'Xatolik yuz berdi'))
      }
    } catch (error) {
      console.error('Error submitting article:', error)
      toast.error('Maqola yuborishda xatolik: ' + error.message, {
        position: 'top-center',
        autoClose: 5000,
      })
      setIsSubmitting(false)
    }
  }

  return (
    <>
      <SEO
        title="Maqola yuborish - KTRI Ilmiy jurnali"
        description="Kasbiy ta'limni rivojlantirish instituti ilmiy jurnalida maqola nashr qilish uchun ariza yuboring"
        keywords="maqola yuborish, ilmiy maqola, nashr qilish, KTRI jurnal, ilmiy tadqiqot"
      />

      <section className="bg-gradient-to-b from-slate-50 via-white to-slate-50 relative min-h-screen w-full py-16 sm:py-24">
        <div className="px-3.5 sm:px-5 mx-auto w-full mb-16 sm:mb-20 xl:w-full 2xl:w-11/12">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold font-serif text-[#0d4ea3] mb-4">
              Maqola yuborish
            </h1>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Tadqiqot natijalaringizni bizning ilmiy jurnalimizda nashr qiling
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-xl border-2 border-gray-100 p-6 sm:p-8 lg:p-10">
            
            {/* Shaxsiy ma'lumotlar */}
            <div className="mb-8">
              <div className="flex items-center gap-3 mb-6 pb-3 border-b-2 border-blue-100">
                <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                  <FaUser className="text-blue-600 text-lg" />
                </div>
                <h2 className="text-xl sm:text-2xl font-bold text-gray-800">Shaxsiy ma'lumotlar</h2>
              </div>

              <div className="grid md:grid-cols-2 2xl:grid-cols-3 gap-6">
                {/* FISH */}
                <div>
                  <label className="block text-base font-semibold text-gray-700 mb-2">
                    F.I.Sh (to'liq): <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleChange}
                    className={`input input-bordered w-full ${
                      errors.fullName ? 'input-error' : ''
                    }`}
                    placeholder="Kiriting"
                  />
                  {errors.fullName && <p className="mt-1 text-sm text-red-500">{errors.fullName}</p>}
                </div>

                {/* Jinsi */}
                <div>
                  <label className="block text-base font-semibold text-gray-700 mb-2">
                    Jinsi <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="gender"
                    value={formData.gender}
                    onChange={handleChange}
                    className={`select select-bordered w-full ${
                      errors.gender ? 'select-error' : ''
                    }`}
                  >
                    <option value="">Tanlang</option>
                    <option value="male">Erkak</option>
                    <option value="female">Ayol</option>
                  </select>
                  {errors.gender && <p className="mt-1 text-sm text-red-500">{errors.gender}</p>}
                </div>

                {/* Telefon */}
                <div>
                  <label className="block text-base font-semibold text-gray-700 mb-2">
                    Telefon raqami: <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    className={`input input-bordered w-full ${
                      errors.phone ? 'input-error' : ''
                    }`}
                    placeholder="+998 (__) ___-__-__"
                  />
                  {errors.phone && <p className="mt-1 text-sm text-red-500">{errors.phone}</p>}
                </div>

                {/* Email */}
                <div>
                  <label className="block text-base font-semibold text-gray-700 mb-2">
                    Elektron pochta: <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className={`input input-bordered w-full ${
                      errors.email ? 'input-error' : ''
                    }`}
                    placeholder="Kiriting"
                  />
                  {errors.email && <p className="mt-1 text-sm text-red-500">{errors.email}</p>}
                </div>

                {/* Ish joyi va lavozimi */}
                <div className="2xl:col-span-2">
                  <label className="block text-base font-semibold text-gray-700 mb-2">
                    Ish joyi (o'qish joyi) va lavozimi: <span className="text-red-500">*</span>
                  </label>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <input
                      type="text"
                      name="workplace"
                      value={formData.workplace}
                      onChange={handleChange}
                      className={`input input-bordered w-full ${
                        errors.workplace ? 'input-error' : ''
                      }`}
                      placeholder="Kiriting"
                    />
                    <input
                      type="text"
                      name="position"
                      value={formData.position}
                      onChange={handleChange}
                      className={`input input-bordered w-full ${
                        errors.position ? 'input-error' : ''
                      }`}
                      placeholder="Lavozim"
                    />
                  </div>
                  {(errors.workplace || errors.position) && (
                    <p className="mt-1 text-sm text-red-500">
                      {errors.workplace || errors.position}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Maqola ma'lumotlari */}
            <div className="mb-8">
              <div className="flex items-center gap-3 mb-6 pb-3 border-b-2 border-green-100">
                <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
                  <FaBook className="text-green-600 text-lg" />
                </div>
                <h2 className="text-xl sm:text-2xl font-bold text-gray-800">Maqola ma'lumotlari</h2>
              </div>

              <div className="grid md:grid-cols-2 2xl:grid-cols-3 gap-6">
                {/* Hamualliflar */}
                <div className="md:col-span-2 2xl:col-span-3">
                  <label className="block text-base font-semibold text-gray-700 mb-2">
                    Maqola hammualliflarining F.I.Sh (to'liq): <span className="text-red-500">*</span>
                  </label>
                  <div className="space-y-3">
                    {coAuthors.map((author, index) => (
                      <div key={index} className="flex flex-col sm:flex-row gap-2">
                        <input
                          type="text"
                          name={index === 0 ? 'authorNames' : `authorNames-${index}`}
                          value={author}
                          onChange={(e) => handleCoAuthorChange(index, e.target.value)}
                          className={`input input-bordered w-full ${
                            errors.authorNames ? 'input-error' : ''
                          }`}
                          placeholder={`${index + 1}-hammuallif F.I.Sh`}
                        />
                        {coAuthors.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeCoAuthor(index)}
                            className="btn btn-outline btn-error sm:w-auto"
                            aria-label="Hammuallifni o'chirish"
                          >
                            <FaTimes />
                          </button>
                        )}
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={addCoAuthor}
                      className="btn btn-outline btn-primary"
                    >
                      + Yana hammuallif qo'shish
                    </button>
                  </div>
                  {errors.authorNames && <p className="mt-1 text-sm text-red-500">{errors.authorNames}</p>}
                </div>

                {/* Rukn */}
                <div>
                  <label className="block text-base font-semibold text-gray-700 mb-2">
                    Rukn tanlang <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="category"
                    value={formData.category}
                    onChange={handleChange}
                    className={`select select-bordered w-full ${
                      errors.category ? 'select-error' : ''
                    }`}
                  >
                    <option value="">Tanlang</option>
                    {CATEGORIES.map((cat, index) => (
                      <option key={index} value={cat}>{cat}</option>
                    ))}
                  </select>
                  {errors.category && <p className="mt-1 text-sm text-red-500">{errors.category}</p>}
                </div>

                {/* Maqola nomi */}
                <div className="md:col-span-2 2xl:col-span-3">
                  <label className="block text-base font-semibold text-gray-700 mb-2">
                    Maqola nomi: <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    name="articleTitle"
                    value={formData.articleTitle}
                    onChange={handleChange}
                    rows={3}
                    className={`textarea textarea-bordered w-full resize-y min-h-24 ${
                      errors.articleTitle ? 'textarea-error' : ''
                    }`}
                    placeholder="Maqola nomini to'liq kiriting"
                  />
                  {errors.articleTitle && <p className="mt-1 text-sm text-red-500">{errors.articleTitle}</p>}
                </div>

                {/* Kalit so'zlar */}
                <div className="md:col-span-2 2xl:col-span-3">
                  <label className="block text-base font-semibold text-gray-700 mb-2">
                    Maqoladagi kalit so'zlar: <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="keywords"
                    value={formData.keywords}
                    onChange={handleChange}
                    className={`input input-bordered w-full ${
                      errors.keywords ? 'input-error' : ''
                    }`}
                    placeholder="kasbiy ta'lim, pedagogika, innovatsiya"
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    Kalit so'zlarni vergul bilan ajratib kiriting. Masalan: kasbiy ta'lim, pedagogika, innovatsiya
                  </p>
                  {errors.keywords && <p className="mt-1 text-sm text-red-500">{errors.keywords}</p>}
                </div>
              </div>

              {/* Annotatsiya va Adabiyotlar - Alohida grid */}
              <div className="grid md:grid-cols-2 gap-6 mt-6">
                {/* Annotatsiya */}
                <div>
                  <label className="block text-base font-semibold text-gray-700 mb-2">
                    Annotatsiya <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    name="annotation"
                    value={formData.annotation}
                    onChange={handleChange}
                    rows={8}
                    className={`textarea textarea-bordered w-full resize-none ${
                      errors.annotation ? 'textarea-error' : ''
                    }`}
                    placeholder="Kiriting"
                  />
                  {errors.annotation && <p className="mt-1 text-sm text-red-500">{errors.annotation}</p>}
                </div>

                {/* Adabiyotlar */}
                <div>
                  <label className="block text-base font-semibold text-gray-700 mb-2">
                    Foydalanilgan adabiyotlar ro'yxati <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    name="bibliography"
                    value={formData.bibliography}
                    onChange={handleChange}
                    rows={8}
                    className={`textarea textarea-bordered w-full resize-none ${
                      errors.bibliography ? 'textarea-error' : ''
                    }`}
                    placeholder="Kiriting"
                  />
                  {errors.bibliography && <p className="mt-1 text-sm text-red-500">{errors.bibliography}</p>}
                </div>
              </div>

              {/* Fayl yuklash - Alohida grid */}
              <div className="mt-6">
                {/* Fayl yuklash */}
                <div>
                  <label className="block text-base font-semibold text-gray-700 mb-2">
                    Maqolani .pdf formatda yuklash kerak. <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="file"
                      id="fileInput"
                      accept=".pdf,application/pdf"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                    <label
                      htmlFor="fileInput"
                      className={`flex items-center gap-3 w-full px-4 py-6 border-2 border-dashed rounded-xl cursor-pointer transition-all hover:border-blue-500 hover:bg-blue-50 ${
                        errors.file ? 'border-red-500 bg-red-50' : 'border-gray-300'
                      }`}
                    >
                      <FaFileUpload className="text-2xl text-blue-600" />
                      <div className="text-left">
                        <p className="font-semibold text-gray-700">
                          {file ? file.name : 'Fayl tanlang'}
                        </p>
                        <p className="text-sm text-gray-500 mt-1">
                          Faqat .pdf formatida
                        </p>
                      </div>
                    </label>
                    {file && (
                      <button
                        type="button"
                        onClick={removeFile}
                        className="absolute top-2 right-2 w-8 h-8 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors"
                      >
                        <FaTimes />
                      </button>
                    )}
                  </div>
                  {errors.file && <p className="mt-1 text-sm text-red-500">{errors.file}</p>}
                  {/* {!file && (
                    <p className="mt-2 text-sm text-red-500">
                      Maqolangiz holati bo'yicha pochatingizga hech qanday xabar bormasa pochtangizning spam bo'limini tekshirib ko'ring.
                    </p>
                  )} */}
                </div>
              </div>
            </div>

            {/* Oferta */}
            <div className="mb-8">
              <div className={`bg-gray-50 border-2 rounded-xl p-6 ${
                errors.acceptTerms ? 'border-red-500' : 'border-gray-200'
              }`}>
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    name="acceptTerms"
                    checked={formData.acceptTerms}
                    onChange={handleChange}
                    className="checkbox checkbox-primary mt-1"
                  />
                  <div className="flex-1">
                    <p className="text-gray-800 font-medium text-base">
                      <button
                        type="button"
                        onClick={() => setShowModal(true)}
                        className="text-blue-600 hover:text-blue-700 underline font-semibold inline-flex items-center gap-2"
                      >
                        <FaFilePdf className="text-lg" />
                        Oferta bilan tanishib chiqish uchun shu yerga bosing
                      </button>
                      <span className="text-red-500 ml-1">*</span>
                    </p>
                  </div>
                </label>
                {errors.acceptTerms && <p className="mt-2 text-sm text-red-500">{errors.acceptTerms}</p>}
              </div>
            </div>

            {/* Submit button */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex items-center justify-center gap-3 px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Yuborilmoqda...</span>
                  </>
                ) : (
                  <>
                    <FaPaperPlane className="text-xl" />
                    <span>Yuborish</span>
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Info card */}
          <div className="mt-8 bg-blue-50 border-2 border-blue-200 rounded-2xl p-6">
            <div className="flex items-start gap-3">
              <FaCheckCircle className="text-blue-600 text-2xl mt-1 shrink-0" />
              <div>
                <h3 className="font-bold text-gray-800 text-lg mb-2">E'tibor bering!</h3>
                <ul className="space-y-2 text-gray-700">
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600 mt-1">•</span>
                    <span>Maqola <strong>8-16 bet</strong> hajmda bo'lishi kerak</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600 mt-1">•</span>
                    <span>Shrift: <strong>Times New Roman, 14</strong></span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600 mt-1">•</span>
                    <span>Originallik kamida <strong>65%</strong> bo'lishi kerak</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600 mt-1">•</span>
                    <span>Adabiyotlar ro'yxati kamida <strong>8-10 ta</strong> manba</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600 mt-1">•</span>
                    <span>Ko'rib chiqish muddati: <strong>5 kun</strong></span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600 mt-1">•</span>
                    <span>Nashr to'lovi: <strong>404 120 so'm</strong></span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* PDF Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl h-[90vh] flex flex-col">
              {/* Modal Header */}
              <div className="flex items-center justify-between p-6 border-b border-gray-200">
                <div className="flex items-center gap-3">
                  <FaFilePdf className="text-3xl text-red-600" />
                  <h2 className="text-2xl font-bold text-gray-800">Oferta shartlari</h2>
                </div>
                <button
                  onClick={() => setShowModal(false)}
                  className="w-10 h-10 bg-gray-100 hover:bg-gray-200 rounded-full flex items-center justify-center transition-colors"
                >
                  <FaTimes className="text-xl text-gray-600" />
                </button>
              </div>

              {/* PDF Viewer */}
              <div className="flex-1 overflow-hidden p-4">
                <iframe
                  src="/oferta.pdf"
                  className="w-full h-full rounded-xl border-2 border-gray-200"
                  title="Oferta PDF"
                />
              </div>

              {/* Modal Footer */}
              <div className="p-6 border-t border-gray-200 bg-gray-50 rounded-b-2xl">
                <div className="flex items-center justify-between">
                  <p className="text-gray-600">
                    Oferta shartlarini o'qib chiqqandan so'ng rozilik belgisini belgilang
                  </p>
                  <button
                    onClick={() => setShowModal(false)}
                    className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl shadow-lg transition-colors"
                  >
                    Yopish
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </section>
    </>
  )
}

export default SendJournal