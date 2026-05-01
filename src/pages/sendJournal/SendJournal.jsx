import React, { useState, useContext } from 'react'
import { useNavigate } from 'react-router-dom'
import { FaPaperPlane, FaUser, FaPhone, FaFileUpload, FaCheckCircle, FaBook, FaTimes, FaFilePdf, FaGraduationCap, FaLightbulb } from 'react-icons/fa'
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

/** Platforma uchun asosiy ko‘k — Login, Contact va boshqalar bilan mos */
const FORM_FOCUS_NORMAL =
  'border border-gray-300 focus:border-transparent focus:ring-2 focus:ring-[#0d4ea3]/35 hover:border-gray-400'

const inputClass = (hasError) =>
  `w-full rounded-lg px-4 py-3 bg-white text-gray-800 transition-all duration-200 outline-none placeholder:text-gray-400 ${
    hasError
      ? 'border border-red-500 focus:border-transparent focus:ring-2 focus:ring-red-500'
      : FORM_FOCUS_NORMAL
  }`

const selectClass = (hasError) =>
  `w-full rounded-lg px-4 py-3 bg-white text-gray-800 transition-all duration-200 outline-none cursor-pointer ${
    hasError
      ? 'border border-red-500 focus:border-transparent focus:ring-2 focus:ring-red-500'
      : FORM_FOCUS_NORMAL
  }`

const textareaClass = (hasError, extra = '') =>
  `w-full rounded-lg px-4 py-3 bg-white text-gray-800 transition-all duration-200 outline-none placeholder:text-gray-400 ${extra} ${
    hasError
      ? 'border border-red-500 focus:border-transparent focus:ring-2 focus:ring-red-500'
      : FORM_FOCUS_NORMAL
  }`

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
    } finally {
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

      <section className="relative min-h-screen w-full overflow-hidden bg-[#f4f7ff] py-14 sm:py-20">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_-10%,rgba(59,130,246,0.22),transparent_55%),radial-gradient(ellipse_50%_50%_at_100%_40%,rgba(99,102,241,0.12),transparent_50%),radial-gradient(ellipse_40%_40%_at_0%_80%,rgba(14,165,233,0.1),transparent_45%)]"
        />
        <div aria-hidden className="pointer-events-none absolute inset-x-0 top-24 h-px bg-gradient-to-r from-transparent via-blue-200/80 to-transparent" />
        <div className="relative z-[1] px-3.5 sm:px-5 mx-auto w-full max-w-6xl xl:max-w-7xl pb-16">
          {/* Hero */}
          <div className="mb-10 sm:mb-14 text-center">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-blue-200/90 bg-white/80 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.2em] text-[#0d4ea3] shadow-sm backdrop-blur-sm">
              Ilmiy nashr
              <span className="hidden h-1 w-1 rounded-full bg-[#0d4ea3]/60 sm:inline-block" aria-hidden />
              Maqola arizasi
            </div>
            <h1 className="mx-auto mb-4 max-w-4xl bg-gradient-to-r from-[#0d4ea3] via-blue-600 to-blue-500 bg-clip-text text-3xl font-bold font-serif tracking-tight text-transparent sm:text-4xl lg:text-[2.85rem] lg:leading-[1.1]">
              Maqola yuborish
            </h1>
            <p className="mx-auto max-w-2xl text-base text-slate-600 sm:text-lg">
              Ilmiy maqolangizni jurnalimizda chop etish uchun arizani quyidagi qadamlarga boʻlib toʻldiring. Texnik talablar uchun o‘ngdagi blokni
              unutmang — maqolangiz faqat PDF shaklda qabul qilinadi.
            </p>
            <div className="mx-auto mt-8 flex flex-wrap items-center justify-center gap-3 text-sm">
              <span className="inline-flex items-center gap-2 rounded-full border border-white/70 bg-white/80 px-4 py-2 text-slate-700 shadow-md backdrop-blur-md">
                <FaGraduationCap className="text-[#0d4ea3]" />
                Akademik yozuv tartibi
              </span>
              <span className="inline-flex items-center gap-2 rounded-full border border-white/70 bg-white/80 px-4 py-2 text-slate-700 shadow-md backdrop-blur-md">
                <FaLightbulb className="text-amber-500" />
                PDF tasdiqlangan format
              </span>
              <span className="inline-flex items-center gap-2 rounded-full border border-white/70 bg-white/80 px-4 py-2 text-slate-700 shadow-md backdrop-blur-md">
                <FaCheckCircle className="text-emerald-600" />
                Tez tasdiqlash uchun to‘liq forma
              </span>
            </div>
          </div>

          <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_18rem] xl:grid-cols-[minmax(0,1fr)_20rem]">
            {/* Main form */}
            <form
              onSubmit={handleSubmit}
              className="rounded-[1.75rem] border border-white/60 bg-white/65 p-6 shadow-[0_20px_50px_-20px_rgba(15,23,42,0.35)] backdrop-blur-xl ring-1 ring-slate-200/50 sm:p-8 lg:p-10"
            >
              {/* 1 */}
              <div className="mb-12">
                <div className="mb-8 flex flex-col gap-4 border-b border-slate-200/80 pb-6 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[#0d4ea3] to-blue-600 text-white shadow-lg shadow-[#0d4ea3]/30">
                      <FaUser className="text-xl" />
                    </div>
                    <div>
                      <p className="text-[11px] font-bold uppercase tracking-widest text-[#0d4ea3]">1-qadam</p>
                      <h2 className="text-xl font-bold text-slate-900 sm:text-2xl">Shaxsiy ma'lumotlar</h2>
                      <p className="mt-1 text-sm text-slate-500">Tashkilot va aloqa uchun</p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-8">
                  <div className="group">
                    <label className="mb-2 flex items-center justify-between text-sm font-semibold text-slate-700">
                      <span>
                        F.I.Sh (to'liq)
                        <span className="ml-1 text-red-500">*</span>
                      </span>
                    </label>
                    <input
                      type="text"
                      name="fullName"
                      value={formData.fullName}
                      onChange={handleChange}
                      className={inputClass(!!errors.fullName)}
                      placeholder="Familiya Ism Sharif"
                    />
                    {errors.fullName && <p className="mt-1.5 text-sm text-red-600">{errors.fullName}</p>}
                  </div>

                  <div className="group">
                    <label className="mb-2 flex text-sm font-semibold text-slate-700">
                      Jinsi
                      <span className="ml-1 text-red-500">*</span>
                    </label>
                    <select
                      name="gender"
                      value={formData.gender}
                      onChange={handleChange}
                      className={selectClass(!!errors.gender)}
                    >
                      <option value="">Tanlang</option>
                      <option value="male">Erkak</option>
                      <option value="female">Ayol</option>
                    </select>
                    {errors.gender && <p className="mt-1.5 text-sm text-red-600">{errors.gender}</p>}
                  </div>

                  <div className="group">
                    <label className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-700">
                      Telefon
                      <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      className={inputClass(!!errors.phone)}
                      placeholder="+998 ..."
                    />
                    {errors.phone && <p className="mt-1.5 text-sm text-red-600">{errors.phone}</p>}
                  </div>

                  <div className="group">
                    <label className="mb-2 flex text-sm font-semibold text-slate-700">
                      Elektron pochta
                      <span className="ml-1 text-red-500">*</span>
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      className={inputClass(!!errors.email)}
                      placeholder="misol@gmail.com"
                    />
                    {errors.email && <p className="mt-1.5 text-sm text-red-600">{errors.email}</p>}
                  </div>

                  <div className="md:col-span-2">
                    <label className="mb-2 flex text-sm font-semibold text-slate-700">
                      Ish joyi (o‘qish joyi) va lavozim
                      <span className="ml-1 text-red-500">*</span>
                    </label>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <input
                        type="text"
                        name="workplace"
                        value={formData.workplace}
                        onChange={handleChange}
                        className={inputClass(!!errors.workplace)}
                        placeholder="Tashkilot yoki oliy ta'lim muassasasi"
                      />
                      <input
                        type="text"
                        name="position"
                        value={formData.position}
                        onChange={handleChange}
                        className={inputClass(!!errors.position)}
                        placeholder="Lavozimingiz"
                      />
                    </div>
                    {(errors.workplace || errors.position) && (
                      <p className="mt-1.5 text-sm text-red-600">{errors.workplace || errors.position}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* 2 */}
              <div className="mb-12">
                <div className="mb-8 flex flex-col gap-4 border-b border-emerald-200/70 pb-6 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-lg shadow-teal-500/30">
                      <FaBook className="text-xl" />
                    </div>
                    <div>
                      <p className="text-[11px] font-bold uppercase tracking-widest text-emerald-600">2-qadam</p>
                      <h2 className="text-xl font-bold text-slate-900 sm:text-2xl">Maqola ma'lumotlari</h2>
                      <p className="mt-1 text-sm text-slate-500">Nashrga tayyor tavsiflar</p>
                    </div>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 2xl:grid-cols-3 gap-x-6 gap-y-8">
                  <div className="md:col-span-2 2xl:col-span-3">
                    <label className="mb-2 flex text-sm font-semibold text-slate-700">
                      Hammualliflar — F.I.Sh
                      <span className="ml-1 text-red-500">*</span>
                    </label>
                    <div className="space-y-3">
                      {coAuthors.map((author, index) => (
                        <div
                          key={index}
                          className="rounded-2xl border border-blue-100/90 bg-gradient-to-r from-white to-blue-50/50 p-4 shadow-sm"
                        >
                          <div className="flex flex-col gap-3 sm:flex-row sm:items-stretch">
                            <div className="flex min-h-10 shrink-0 items-center">
                              <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#0d4ea3] text-sm font-bold text-white shadow-md">
                                {index + 1}
                              </span>
                            </div>
                            <input
                              type="text"
                              name={index === 0 ? 'authorNames' : `authorNames-${index}`}
                              value={author}
                              onChange={(e) => handleCoAuthorChange(index, e.target.value)}
                              className={inputClass(!!errors.authorNames)}
                              placeholder={`${index + 1}-hammuallif F.I.Sh`}
                            />
                            {coAuthors.length > 1 && (
                              <button
                                type="button"
                                onClick={() => removeCoAuthor(index)}
                                className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-red-200 bg-red-50 text-red-600 transition hover:bg-red-100"
                                aria-label="Hammuallifni o'chirish"
                              >
                                <FaTimes />
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                      <button
                        type="button"
                        onClick={addCoAuthor}
                        className="w-full rounded-2xl border-2 border-dashed border-[#0d4ea3]/35 bg-blue-50/70 py-3 text-sm font-semibold text-[#0d4ea3] transition hover:border-[#0d4ea3] hover:bg-blue-100/80 sm:w-auto sm:px-6"
                      >
                        + Yana hammuallif
                      </button>
                    </div>
                    {errors.authorNames && <p className="mt-1.5 text-sm text-red-600">{errors.authorNames}</p>}
                  </div>

                  <div className="md:col-span-2 2xl:col-span-1">
                    <label className="mb-2 flex text-sm font-semibold text-slate-700">
                      Rukn
                      <span className="ml-1 text-red-500">*</span>
                    </label>
                    <select
                      name="category"
                      value={formData.category}
                      onChange={handleChange}
                      className={selectClass(!!errors.category)}
                    >
                      <option value="">Tanlang</option>
                      {CATEGORIES.map((cat, index) => (
                        <option key={index} value={cat}>
                          {cat}
                        </option>
                      ))}
                    </select>
                    {errors.category && <p className="mt-1.5 text-sm text-red-600">{errors.category}</p>}
                  </div>

                  <div className="md:col-span-2 2xl:col-span-3">
                    <label className="mb-2 flex text-sm font-semibold text-slate-700">
                      Maqola nomi
                      <span className="ml-1 text-red-500">*</span>
                    </label>
                    <textarea
                      name="articleTitle"
                      value={formData.articleTitle}
                      onChange={handleChange}
                      rows={4}
                      className={textareaClass(!!errors.articleTitle, 'min-h-[6.5rem] resize-y')}
                      placeholder="Maqola nomini to'liq kiriting (bir necha qator bo'lishi mumkin)"
                    />
                    {errors.articleTitle && <p className="mt-1.5 text-sm text-red-600">{errors.articleTitle}</p>}
                  </div>

                  <div className="md:col-span-2 2xl:col-span-3">
                    <label className="mb-2 flex text-sm font-semibold text-slate-700">
                      Kalit so'zlar
                      <span className="ml-1 text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="keywords"
                      value={formData.keywords}
                      onChange={handleChange}
                      className={inputClass(!!errors.keywords)}
                      placeholder="kasbiy ta'lim, pedagogika, innovatsiya"
                    />
                    <p className="mt-2 rounded-xl bg-amber-50/90 px-4 py-2 text-xs leading-relaxed text-amber-900 ring-1 ring-amber-200/80">
                      <strong className="font-semibold">Eslatma:</strong> kalit so‘zlarni{' '}
                      <span className="font-mono font-semibold">vergul</span> bilan ajratib yozing — masalan:{' '}
                      <span className="font-medium">kasbiy ta'lim, pedagogika, innovatsiya</span>
                    </p>
                    {errors.keywords && <p className="mt-1.5 text-sm text-red-600">{errors.keywords}</p>}
                  </div>
                </div>

                <div className="mt-10 grid gap-6 md:grid-cols-2">
                  <div>
                    <label className="mb-2 flex text-sm font-semibold text-slate-700">
                      Annotatsiya
                      <span className="ml-1 text-red-500">*</span>
                    </label>
                    <textarea
                      name="annotation"
                      value={formData.annotation}
                      onChange={handleChange}
                      rows={10}
                      className={textareaClass(!!errors.annotation)}
                      placeholder="Maqola mazmuni va natijalari qisqacha"
                    />
                    {errors.annotation && <p className="mt-1.5 text-sm text-red-600">{errors.annotation}</p>}
                  </div>
                  <div>
                    <label className="mb-2 flex text-sm font-semibold text-slate-700">
                      Adabiyotlar ro'yxati
                      <span className="ml-1 text-red-500">*</span>
                    </label>
                    <textarea
                      name="bibliography"
                      value={formData.bibliography}
                      onChange={handleChange}
                      rows={10}
                      className={textareaClass(!!errors.bibliography)}
                      placeholder="APA yoki boshqa standartda ro'yxat"
                    />
                    {errors.bibliography && (
                      <p className="mt-1.5 text-sm text-red-600">{errors.bibliography}</p>
                    )}
                  </div>
                </div>

                {/* PDF */}
                <div className="mt-10">
                  <label className="mb-2 flex text-sm font-semibold text-slate-700">
                    Maqola fayli (faqat PDF)
                    <span className="ml-1 text-red-500">*</span>
                  </label>
                  <input
                    type="file"
                    id="fileInput"
                    accept=".pdf,application/pdf"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  <label
                    htmlFor="fileInput"
                    className={`relative block cursor-pointer overflow-hidden rounded-[1.35rem] border-2 border-dashed p-6 transition-all duration-300 sm:p-8 ${
                      errors.file
                        ? 'border-red-400 bg-red-50/90'
                        : file
                          ? 'border-emerald-400 bg-gradient-to-br from-emerald-50/95 to-teal-50/80 shadow-inner'
                          : 'border-slate-300/90 bg-gradient-to-br from-white to-slate-50 hover:border-[#0d4ea3]/70 hover:shadow-[0_0_0_4px_rgba(13,78,163,0.12)]'
                    }`}
                  >
                    <div className="flex flex-col items-center gap-4 text-center sm:flex-row sm:text-left">
                      <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-red-500 to-red-600 text-white shadow-lg">
                        <FaFilePdf className="text-2xl" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-lg font-bold text-slate-800">{file ? file.name : 'PDF faylni bu yerga torting yoki tanlang'}</p>
                        <p className="mt-1 text-sm text-slate-500">
                          Maksimal hajmdan oldin server cheklovi mavjud bo‘lishi mumkin — agar muammo chiqsa bizga yozing.
                        </p>
                        {file && (
                          <p className="mt-2 inline-flex rounded-lg bg-emerald-100/90 px-2.5 py-1 text-xs font-medium text-emerald-800 ring-1 ring-emerald-200">
                            Fayl tayyor
                          </p>
                        )}
                      </div>
                      <FaFileUpload className="hidden text-3xl text-[#0d4ea3]/80 opacity-90 sm:block" aria-hidden />
                    </div>
                    {file && (
                      <button
                        type="button"
                        onClick={removeFile}
                        className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-white/95 text-red-600 shadow-md ring-1 ring-slate-200 hover:bg-red-50"
                        aria-label="Faylni olib tashlash"
                      >
                        <FaTimes className="text-sm" />
                      </button>
                    )}
                  </label>
                  {errors.file && <p className="mt-1.5 text-sm text-red-600">{errors.file}</p>}
                </div>
              </div>

              {/* Oferta + Submit */}
              <div
                className={`rounded-2xl border-2 bg-gradient-to-r from-slate-50 via-white to-blue-50/40 p-6 shadow-inner ring-1 ${
                  errors.acceptTerms ? 'border-red-300 ring-red-100' : 'border-blue-100/90 ring-blue-50/80'
                }`}
              >
                <label className="flex cursor-pointer items-start gap-4">
                  <input
                    type="checkbox"
                    name="acceptTerms"
                    checked={formData.acceptTerms}
                    onChange={handleChange}
                    className="checkbox checkbox-primary mt-1 [--chkfg:white]"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold leading-relaxed text-slate-800">
                      <button
                        type="button"
                        onClick={() => setShowModal(true)}
                        className="inline-flex items-center gap-2 rounded-lg bg-white/90 px-2 py-0.5 text-[#0d4ea3] underline decoration-[#0d4ea3]/40 underline-offset-2 transition hover:bg-blue-50 hover:text-blue-800"
                      >
                        <FaFilePdf className="text-lg shrink-0" />
                        Oferta bilan tanishing
                      </button>
                      <span className="text-red-500"> *</span> — rozilik bildiring.
                    </p>
                    <p className="mt-2 text-xs text-slate-500">
                      Yuborishdan oldin texnik talablarni chap tomonda ko‘ring.
                    </p>
                  </div>
                </label>
                {errors.acceptTerms && <p className="mt-4 text-sm text-red-600">{errors.acceptTerms}</p>}

                <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:justify-end">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="group relative inline-flex min-h-[3.25rem] w-full items-center justify-center gap-3 overflow-hidden rounded-2xl bg-gradient-to-r from-[#0d4ea3] to-blue-600 px-10 py-4 text-lg font-bold text-white shadow-xl shadow-[#0d4ea3]/25 transition hover:shadow-[#0d4ea3]/35 disabled:cursor-not-allowed disabled:opacity-55 sm:w-auto"
                  >
                    <span
                      aria-hidden
                      className="absolute inset-0 translate-x-full bg-white/15 transition-transform duration-500 group-hover:translate-x-0 group-disabled:translate-x-full"
                    />
                    {isSubmitting ? (
                      <>
                        <span className="loading loading-spinner loading-md text-white" />
                        Yuborilmoqda...
                      </>
                    ) : (
                      <>
                        <FaPaperPlane className="relative text-xl transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                        <span className="relative">Maqolani yuborish</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </form>

            {/* Sidebar */}
            <aside className="lg:sticky lg:top-24 space-y-6 self-start">
              <div className="rounded-[1.75rem] border border-emerald-200/60 bg-gradient-to-br from-emerald-500/95 via-teal-600 to-cyan-600 p-[1px] shadow-xl shadow-teal-500/25">
                <div className="rounded-[1.68rem] bg-white/95 p-6 backdrop-blur-sm">
                  <div className="mb-5 flex items-center gap-3">
                    <FaCheckCircle className="text-2xl text-emerald-600" />
                    <h3 className="text-lg font-bold text-slate-900">E'tibor bering</h3>
                  </div>
                  <ul className="space-y-3 text-sm leading-relaxed text-slate-600">
                    {[
                      { t: <>Maqola <strong className="text-slate-800">8–16 bet</strong> hajmda</> },
                      { t: <>Shrift: <strong className="text-slate-800">Times New Roman, 14</strong></> },
                      { t: <>Originallik kamida <strong className="text-slate-800">65%</strong></> },
                      { t: <>Adabiyotlar kamida <strong className="text-slate-800">8–10</strong> manba</> },
                      { t: <>Ko‘rib chiqish: taxminan <strong className="text-slate-800">5 kun</strong></> },
                      { t: <>Nashr to‘lovi: <strong className="text-slate-800">404 120 so‘m</strong></> },
                    ].map((row, idx) => (
                      <li key={idx} className="flex gap-3 rounded-xl bg-slate-50/90 px-3 py-2.5 ring-1 ring-slate-100">
                        <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-teal-100 text-xs font-bold text-teal-700">
                          {idx + 1}
                        </span>
                        <span>{row.t}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="rounded-[1.5rem] border border-white/70 bg-white/70 p-5 text-center shadow-lg backdrop-blur-md ring-1 ring-slate-200/60">
                <p className="text-sm font-medium text-slate-700">Savol va texnik muammo uchun</p>
                <p className="mt-2 text-xs text-slate-500">
                  Aloqa sahifasi orqali murojaat qiling — ariza yuborilganidan keyin panelingizdan holatni kuzating.
                </p>
              </div>
            </aside>
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