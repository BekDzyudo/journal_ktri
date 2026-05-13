import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { FaPaperPlane, FaUser, FaFileUpload, FaCheckCircle, FaBook, FaTimes, FaFilePdf, FaGraduationCap, FaLightbulb, FaFileAlt } from 'react-icons/fa'
import { toast } from 'react-toastify'
import SEO from '../../components/SEO'
import { getAccessToken, getUserData } from '../../utils/authStorage'
import { parseApiError } from '../../utils/apiError'
import useRuknlar from '../../hooks/useRuknlar'

const INITIAL_FORM_DATA = {
  category: '',
  articleTitle: '',
  keywords: '',
  annotation: '',
  bibliography: '',
  acceptTerms: false
}

const INITIAL_AUTHOR = {
  fullName: '',
  phone: '',
  email: '',
  workplace: '',
  position: ''
}

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
  const navigate = useNavigate()
  const { ruknlar, isPending: ruknlarLoading, error: ruknlarError } = useRuknlar()
  const [formData, setFormData] = useState(INITIAL_FORM_DATA)

  const currentUser = getUserData()
  const currentUserEmail = currentUser?.email || ''

  const [authors, setAuthors] = useState([{ ...INITIAL_AUTHOR, email: currentUserEmail }])
  const [file, setFile] = useState(null)
  const [errors, setErrors] = useState({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [dragOver, setDragOver] = useState(false)

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

  const handleAuthorChange = (index, field, value) => {
    const errorKey = `authors.${index}.${field}`

    setAuthors((prev) =>
      prev.map((author, idx) => (idx === index ? { ...author, [field]: value } : author))
    )
    if (errors[errorKey]) {
      setErrors((prev) => ({ ...prev, [errorKey]: '' }))
    }
  }

  const addAuthor = () => {
    setAuthors((prev) => [...prev, { ...INITIAL_AUTHOR }])
  }

  const removeAuthor = (index) => {
    setAuthors((prev) => {
      const next = prev.filter((_, idx) => idx !== index)
      return next.length ? next : [{ ...INITIAL_AUTHOR }]
    })
  }

  const processFile = (selectedFile) => {
    const fileExtension = selectedFile.name.split('.').pop().toLowerCase()
    const isDoc =
      fileExtension === 'doc' ||
      fileExtension === 'docx' ||
      selectedFile.type === 'application/msword' ||
      selectedFile.type === 'application/vnd.ms-word' ||
      selectedFile.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'

    if (isDoc) {
      setFile(selectedFile)
      if (errors.file) setErrors(prev => ({ ...prev, file: '' }))
    } else {
      setErrors(prev => ({ ...prev, file: 'Faqat .doc yoki .docx (Word) formatdagi faylni yuklash mumkin' }))
    }
  }

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0]
    if (selectedFile) {
      processFile(selectedFile)
      e.target.value = null
    }
  }

  const handleDrop = (e) => {
    e.preventDefault()
    setDragOver(false)
    const droppedFile = e.dataTransfer.files[0]
    if (droppedFile) processFile(droppedFile)
  }

  const removeFile = () => {
    setFile(null)
    const el = document.getElementById('fileInput')
    if (el) el.value = null
  }

  const validateForm = () => {
    const newErrors = {}

    authors.forEach((author, index) => {
      if (!author.fullName.trim()) newErrors[`authors.${index}.fullName`] = 'FISH ni kiriting'
      if (!author.phone.trim()) newErrors[`authors.${index}.phone`] = 'Telefon raqamini kiriting'
      if (!author.email.trim()) {
        newErrors[`authors.${index}.email`] = 'Elektron pochtani kiriting'
      } else if (!/\S+@\S+\.\S+/.test(author.email)) {
        newErrors[`authors.${index}.email`] = 'Noto\'g\'ri elektron pochta formati'
      }
      if (!author.workplace.trim()) newErrors[`authors.${index}.workplace`] = 'Ish joyini kiriting'
      if (!author.position.trim()) newErrors[`authors.${index}.position`] = 'Lavozimni kiriting'
    })

    if (!formData.category) newErrors.category = 'Ruknni tanlang'
    if (!formData.articleTitle.trim()) newErrors.articleTitle = 'Maqola nomini kiriting'
    if (!formData.keywords.trim()) newErrors.keywords = 'Kalit so\'zlarni kiriting'
    if (!formData.annotation.trim()) newErrors.annotation = 'Annotatsiyani kiriting'
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

    const accessToken = getAccessToken()
    if (!accessToken) {
      toast.error('Maqola yuborish uchun avval tizimga kiring.', { position: 'top-center' })
      navigate('/login', { state: { from: '/send-article' } })
      return
    }

    const rukn = parseInt(formData.category, 10)
    const validIds = new Set(ruknlar.map((r) => r.id))
    if (!Number.isFinite(rukn) || !validIds.has(rukn)) {
      toast.error('Ruknni tanlang.', { position: 'top-center' })
      return
    }

    setIsSubmitting(true)

    try {
      const apiForm = new FormData()
      apiForm.append('sarlavha', formData.articleTitle.trim())
      apiForm.append('rukn', String(rukn))
      apiForm.append('kalit_sozlar', formData.keywords.trim())
      apiForm.append('annotatsiya', formData.annotation.trim())
      apiForm.append('fayl', file, file.name)

      const mualliflar = authors.map((a) => ({
        ism_familya: a.fullName.trim(),
        telefon: a.phone.trim(),
        email: a.email.trim(),
        tashkilot: a.workplace.trim(),
        lavozim: a.position.trim(),
      }))
      apiForm.append('mualliflar', JSON.stringify(mualliflar))

      const response = await fetch(`${import.meta.env.VITE_BASE_URL}/maqola-yuborish/`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
        body: apiForm,
      })

      let data = null
      try {
        data = await response.json()
      } catch {
        data = null
      }

      if (!response.ok) {
        const msg = parseApiError(data, `Yuborish muvaffaqiyatsiz (${response.status})`)
        throw new Error(msg)
      }

      toast.success("Maqola muvaffaqiyatli yuborildi. Holatni panelingizda kuzating.", {
        position: 'top-center',
        autoClose: 4000,
      })

      setFormData(INITIAL_FORM_DATA)
      setAuthors([{ ...INITIAL_AUTHOR }])
      setFile(null)
      const inputEl = document.getElementById('fileInput')
      if (inputEl) inputEl.value = null
      navigate('/profile')
    } catch (error) {
      toast.error(error.message || 'Maqola yuborishda xatolik yuz berdi', {
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
            <p className="mx-auto max-w-3xl text-base text-slate-600 sm:text-lg">
              Ilmiy maqolangizni jurnalimizda chop etish uchun arizani quyidagi qadamlarga boʻlib toʻldiring. Fayl{' '}
              <strong className="font-semibold text-slate-800">.doc / .docx</strong> formatida yuboriladi; texnik talablar uchun o'ngdagi blokni unutmang.
            </p>
            <div className="mx-auto mt-8 flex flex-wrap items-center justify-center gap-3 text-sm">
              <span className="inline-flex items-center gap-2 rounded-full border border-white/70 bg-white/80 px-4 py-2 text-slate-700 shadow-md backdrop-blur-md">
                <FaGraduationCap className="text-[#0d4ea3]" />
                Akademik yozuv tartibi
              </span>
              <span className="inline-flex items-center gap-2 rounded-full border border-white/70 bg-white/80 px-4 py-2 text-slate-700 shadow-md backdrop-blur-md">
                <FaLightbulb className="text-amber-500" />
                Word .doc / .docx format
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
                      <h2 className="text-xl font-bold text-slate-900 sm:text-2xl">Mualliflar</h2>
                      <p className="mt-1 text-sm text-slate-500">Asosiy muallif va hammualliflar ma'lumotlari</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-5">
                  {authors.map((author, index) => {
                    const authorLabel = `${index + 1}-muallif`

                    return (
                      <div
                        key={index}
                        className="rounded-2xl border border-blue-100/90 bg-gradient-to-r from-white to-blue-50/50 p-4 shadow-sm sm:p-5"
                      >
                        <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                          <div className="flex items-center gap-3">
                            <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#0d4ea3] text-sm font-bold text-white shadow-md">
                              {index + 1}
                            </span>
                            <h3 className="text-base font-bold text-slate-900">{authorLabel}</h3>
                          </div>
                          {authors.length > 1 && (
                            <button
                              type="button"
                              onClick={() => removeAuthor(index)}
                              className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 text-sm font-semibold text-red-600 transition hover:bg-red-100 sm:w-auto"
                              aria-label={`${authorLabel}ni o'chirish`}
                            >
                              <FaTimes />
                              O'chirish
                            </button>
                          )}
                        </div>

                        <div className="grid grid-cols-1 gap-x-6 gap-y-6 md:grid-cols-2">
                          <div className="md:col-span-2">
                            <label className="mb-2 flex items-center justify-between text-sm font-semibold text-slate-700">
                              <span>
                                F.I.Sh
                                <span className="ml-1 text-red-500">*</span>
                              </span>
                            </label>
                            <input
                              type="text"
                              name={`authors.${index}.fullName`}
                              value={author.fullName}
                              onChange={(e) => handleAuthorChange(index, 'fullName', e.target.value)}
                              className={inputClass(!!errors[`authors.${index}.fullName`])}
                              placeholder="Familiya Ism Sharif"
                            />
                            {errors[`authors.${index}.fullName`] && (
                              <p className="mt-1.5 text-sm text-red-600">{errors[`authors.${index}.fullName`]}</p>
                            )}
                          </div>

                          <div>
                            <label className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-700">
                              Telefon
                              <span className="text-red-500">*</span>
                            </label>
                            <input
                              type="tel"
                              name={`authors.${index}.phone`}
                              value={author.phone}
                              onChange={(e) => handleAuthorChange(index, 'phone', e.target.value)}
                              className={inputClass(!!errors[`authors.${index}.phone`])}
                              placeholder="+998 ..."
                            />
                            {errors[`authors.${index}.phone`] && (
                              <p className="mt-1.5 text-sm text-red-600">{errors[`authors.${index}.phone`]}</p>
                            )}
                          </div>

                          <div>
                            <label className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-700">
                              Gmail
                              <span className="text-red-500">*</span>
                            </label>
                            <input
                              type="email"
                              name={`authors.${index}.email`}
                              value={author.email}
                              onChange={(e) => handleAuthorChange(index, 'email', e.target.value)}
                              className={inputClass(!!errors[`authors.${index}.email`])}
                              placeholder="misol@gmail.com"
                            />
                            {errors[`authors.${index}.email`] && (
                              <p className="mt-1.5 text-sm text-red-600">{errors[`authors.${index}.email`]}</p>
                            )}
                          </div>

                          <div>
                            <label className="mb-2 flex text-sm font-semibold text-slate-700">
                              Ish joyi
                              <span className="ml-1 text-red-500">*</span>
                            </label>
                            <input
                              type="text"
                              name={`authors.${index}.workplace`}
                              value={author.workplace}
                              onChange={(e) => handleAuthorChange(index, 'workplace', e.target.value)}
                              className={inputClass(!!errors[`authors.${index}.workplace`])}
                              placeholder="Tashkilot yoki oliy ta'lim muassasasi"
                            />
                            {errors[`authors.${index}.workplace`] && (
                              <p className="mt-1.5 text-sm text-red-600">{errors[`authors.${index}.workplace`]}</p>
                            )}
                          </div>

                          <div>
                            <label className="mb-2 flex text-sm font-semibold text-slate-700">
                              Lavozim
                              <span className="ml-1 text-red-500">*</span>
                            </label>
                            <input
                              type="text"
                              name={`authors.${index}.position`}
                              value={author.position}
                              onChange={(e) => handleAuthorChange(index, 'position', e.target.value)}
                              className={inputClass(!!errors[`authors.${index}.position`])}
                              placeholder="Lavozimingiz"
                            />
                            {errors[`authors.${index}.position`] && (
                              <p className="mt-1.5 text-sm text-red-600">{errors[`authors.${index}.position`]}</p>
                            )}
                          </div>
                        </div>
                      </div>
                    )
                  })}

                  <button
                    type="button"
                    onClick={addAuthor}
                    className="w-full rounded-2xl border-2 border-dashed border-[#0d4ea3]/35 bg-blue-50/70 py-3 text-sm font-semibold text-[#0d4ea3] transition hover:border-[#0d4ea3] hover:bg-blue-100/80 sm:w-auto sm:px-6"
                  >
                    + Muallif qo'shish
                  </button>
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

                <div className="space-y-8">
                  <div>
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

                  <div>
                    <label className="mb-2 flex text-sm font-semibold text-slate-700">
                      Rukn
                      <span className="ml-1 text-red-500">*</span>
                    </label>
                    {ruknlarError && (
                      <p className="mb-2 text-sm text-red-600">
                        Ruknlarni yuklashda xatolik. Sahifani yangilab ko‘ring.
                      </p>
                    )}
                    <select
                      name="category"
                      value={formData.category}
                      onChange={handleChange}
                      disabled={ruknlarLoading || !!ruknlarError || ruknlar.length === 0}
                      className={selectClass(!!errors.category)}
                    >
                      <option value="">
                        {ruknlarLoading ? 'Ruknlar yuklanmoqda...' : 'Tanlang'}
                      </option>
                      {ruknlar.map((r) => (
                        <option key={r.id} value={String(r.id)}>
                          {r.kod ? `${r.kod}. ` : ''}{r.nom}
                        </option>
                      ))}
                    </select>
                    {errors.category && <p className="mt-1.5 text-sm text-red-600">{errors.category}</p>}
                  </div>

                  <div>
                    <label className="mb-2 flex text-sm font-semibold text-slate-700">
                      Adabiyotlar ro‘yxati
                      <span className="ml-2 rounded-md bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-500">ixtiyoriy</span>
                    </label>
                    <textarea
                      name="bibliography"
                      value={formData.bibliography}
                      onChange={handleChange}
                      rows={10}
                      className={textareaClass(false)}
                      placeholder="APA yoki boshqa standartda ro'yxat (hozircha API orqali yuborilmaydi)"
                    />
                  </div>
                </div>

                {/* Maqola fayli .doc/.docx */}
                <div className="mt-10">
                  <label className="mb-2 flex text-sm font-semibold text-slate-700">
                    Maqola fayli (.doc yoki .docx)
                    <span className="ml-1 text-red-500">*</span>
                  </label>
                  <input
                    type="file"
                    id="fileInput"
                    accept=".doc,.docx,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  <label
                    htmlFor="fileInput"
                    onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                    onDragEnter={(e) => { e.preventDefault(); setDragOver(true); }}
                    onDragLeave={() => setDragOver(false)}
                    onDrop={handleDrop}
                    className={`relative block cursor-pointer overflow-hidden rounded-[1.35rem] border-2 border-dashed p-6 transition-all duration-300 sm:p-8 ${
                      errors.file
                        ? 'border-red-400 bg-red-50/90'
                        : file
                          ? 'border-emerald-400 bg-gradient-to-br from-emerald-50/95 to-teal-50/80 shadow-inner'
                          : dragOver
                            ? 'border-[#0d4ea3] bg-blue-50/70 shadow-[0_0_0_4px_rgba(13,78,163,0.12)]'
                            : 'border-slate-300/90 bg-gradient-to-br from-white to-slate-50 hover:border-[#0d4ea3]/70 hover:shadow-[0_0_0_4px_rgba(13,78,163,0.12)]'
                    }`}
                  >
                    <div className="flex flex-col items-center gap-4 text-center sm:flex-row sm:text-left">
                      <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white shadow-lg">
                        <FaFileAlt className="text-2xl" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-lg font-bold text-slate-800">{file ? file.name : dragOver ? 'Faylni tashlang...' : '.doc / .docx faylni bu yerga tashlang yoki tanlang'}</p>
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
                      { t: <>Nashr to‘lovi: <strong className="text-slate-800">309 000 so‘m</strong></> },
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