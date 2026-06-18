export interface MandarinTypingQuestion {
	id: number
	answer: string
	meaningHintId: string
	pinyinHint: string
}

export type SupportedHskLevel = 1 | 2 | 3 | 4
export type AssignmentALevel = "A1" | "A2" | "A3"

const SUPPORTED_HSK_LEVELS: SupportedHskLevel[] = [1, 2, 3, 4]
const ASSIGNMENT_A_LEVELS: AssignmentALevel[] = ["A1", "A2", "A3"]

export function isSupportedHskLevel(value: number): value is SupportedHskLevel {
	return SUPPORTED_HSK_LEVELS.includes(value as SupportedHskLevel)
}

export function isAssignmentALevel(value: string): value is AssignmentALevel {
	return ASSIGNMENT_A_LEVELS.includes(value as AssignmentALevel)
}

export const mandarinTypingQuestionSets: Record<
	SupportedHskLevel,
	Record<AssignmentALevel, MandarinTypingQuestion[]>
> = {
	1: {
		A1: [
			{ id: 1, answer: "你好", meaningHintId: "Halo", pinyinHint: "ni hao" },
			{ id: 2, answer: "谢谢", meaningHintId: "Terima kasih", pinyinHint: "xie xie" },
			{ id: 3, answer: "再见", meaningHintId: "Sampai jumpa", pinyinHint: "zai jian" },
			{ id: 4, answer: "请", meaningHintId: "Silakan", pinyinHint: "qing" },
			{ id: 5, answer: "对不起", meaningHintId: "Maaf", pinyinHint: "dui bu qi" },
			{ id: 6, answer: "没关系", meaningHintId: "Tidak apa-apa", pinyinHint: "mei guan xi" },
			{ id: 7, answer: "是", meaningHintId: "Ya / adalah", pinyinHint: "shi" },
			{ id: 8, answer: "不是", meaningHintId: "Bukan / tidak", pinyinHint: "bu shi" },
			{ id: 9, answer: "我", meaningHintId: "Saya", pinyinHint: "wo" },
			{ id: 10, answer: "你", meaningHintId: "Kamu", pinyinHint: "ni" },
		],
		A2: [
			{ id: 1, answer: "老师", meaningHintId: "Guru", pinyinHint: "lao shi" },
			{ id: 2, answer: "学生", meaningHintId: "Murid", pinyinHint: "xue sheng" },
			{ id: 3, answer: "朋友", meaningHintId: "Teman", pinyinHint: "peng you" },
			{ id: 4, answer: "家", meaningHintId: "Rumah", pinyinHint: "jia" },
			{ id: 5, answer: "妈妈", meaningHintId: "Ibu", pinyinHint: "ma ma" },
			{ id: 6, answer: "爸爸", meaningHintId: "Ayah", pinyinHint: "ba ba" },
			{ id: 7, answer: "水", meaningHintId: "Air", pinyinHint: "shui" },
			{ id: 8, answer: "茶", meaningHintId: "Teh", pinyinHint: "cha" },
			{ id: 9, answer: "米饭", meaningHintId: "Nasi", pinyinHint: "mi fan" },
			{ id: 10, answer: "学校", meaningHintId: "Sekolah", pinyinHint: "xue xiao" },
		],
		A3: [
			{ id: 1, answer: "你好吗", meaningHintId: "Apa kabar?", pinyinHint: "ni hao ma" },
			{ id: 2, answer: "我很好", meaningHintId: "Saya baik", pinyinHint: "wo hen hao" },
			{ id: 3, answer: "我叫安娜", meaningHintId: "Nama saya Anna", pinyinHint: "wo jiao an na" },
			{ id: 4, answer: "你叫什么", meaningHintId: "Siapa nama kamu?", pinyinHint: "ni jiao shen me" },
			{ id: 5, answer: "我爱你", meaningHintId: "Aku cinta kamu", pinyinHint: "wo ai ni" },
			{ id: 6, answer: "我会中文", meaningHintId: "Saya bisa bahasa Mandarin", pinyinHint: "wo hui zhong wen" },
			{ id: 7, answer: "我不懂", meaningHintId: "Saya tidak paham", pinyinHint: "wo bu dong" },
			{ id: 8, answer: "我回家", meaningHintId: "Saya pulang ke rumah", pinyinHint: "wo hui jia" },
			{ id: 9, answer: "我们是朋友", meaningHintId: "Kita teman", pinyinHint: "wo men shi peng you" },
			{ id: 10, answer: "我喜欢茶", meaningHintId: "Saya suka teh", pinyinHint: "wo xi huan cha" },
		],
	},
	2: {
		A1: [
			{ id: 1, answer: "现在", meaningHintId: "Sekarang", pinyinHint: "xian zai" },
			{ id: 2, answer: "时候", meaningHintId: "Waktu", pinyinHint: "shi hou" },
			{ id: 3, answer: "早上", meaningHintId: "Pagi", pinyinHint: "zao shang" },
			{ id: 4, answer: "晚上", meaningHintId: "Malam", pinyinHint: "wan shang" },
			{ id: 5, answer: "昨天", meaningHintId: "Kemarin", pinyinHint: "zuo tian" },
			{ id: 6, answer: "今天", meaningHintId: "Hari ini", pinyinHint: "jin tian" },
			{ id: 7, answer: "明天", meaningHintId: "Besok", pinyinHint: "ming tian" },
			{ id: 8, answer: "工作", meaningHintId: "Bekerja", pinyinHint: "gong zuo" },
			{ id: 9, answer: "休息", meaningHintId: "Istirahat", pinyinHint: "xiu xi" },
			{ id: 10, answer: "学习", meaningHintId: "Belajar", pinyinHint: "xue xi" },
		],
		A2: [
			{ id: 1, answer: "医院", meaningHintId: "Rumah sakit", pinyinHint: "yi yuan" },
			{ id: 2, answer: "公司", meaningHintId: "Perusahaan", pinyinHint: "gong si" },
			{ id: 3, answer: "饭店", meaningHintId: "Restoran", pinyinHint: "fan dian" },
			{ id: 4, answer: "商店", meaningHintId: "Toko", pinyinHint: "shang dian" },
			{ id: 5, answer: "出租车", meaningHintId: "Taksi", pinyinHint: "chu zu che" },
			{ id: 6, answer: "火车站", meaningHintId: "Stasiun kereta", pinyinHint: "huo che zhan" },
			{ id: 7, answer: "飞机", meaningHintId: "Pesawat", pinyinHint: "fei ji" },
			{ id: 8, answer: "衣服", meaningHintId: "Baju", pinyinHint: "yi fu" },
			{ id: 9, answer: "手机", meaningHintId: "Ponsel", pinyinHint: "shou ji" },
			{ id: 10, answer: "电脑", meaningHintId: "Komputer", pinyinHint: "dian nao" },
		],
		A3: [
			{ id: 1, answer: "我在学习", meaningHintId: "Saya sedang belajar", pinyinHint: "wo zai xue xi" },
			{ id: 2, answer: "他在工作", meaningHintId: "Dia sedang bekerja", pinyinHint: "ta zai gong zuo" },
			{ id: 3, answer: "我想回家", meaningHintId: "Saya ingin pulang", pinyinHint: "wo xiang hui jia" },
			{ id: 4, answer: "我们去学校", meaningHintId: "Kita pergi ke sekolah", pinyinHint: "wo men qu xue xiao" },
			{ id: 5, answer: "你吃了吗", meaningHintId: "Kamu sudah makan?", pinyinHint: "ni chi le ma" },
			{ id: 6, answer: "我听不懂", meaningHintId: "Saya tidak mengerti", pinyinHint: "wo ting bu dong" },
			{ id: 7, answer: "请你等我", meaningHintId: "Tolong tunggu saya", pinyinHint: "qing ni deng wo" },
			{ id: 8, answer: "我喜欢运动", meaningHintId: "Saya suka olahraga", pinyinHint: "wo xi huan yun dong" },
			{ id: 9, answer: "今天很热", meaningHintId: "Hari ini panas", pinyinHint: "jin tian hen re" },
			{ id: 10, answer: "明天见", meaningHintId: "Sampai besok", pinyinHint: "ming tian jian" },
		],
	},
	3: {
		A1: [
			{ id: 1, answer: "文化", meaningHintId: "Budaya", pinyinHint: "wen hua" },
			{ id: 2, answer: "历史", meaningHintId: "Sejarah", pinyinHint: "li shi" },
			{ id: 3, answer: "经验", meaningHintId: "Pengalaman", pinyinHint: "jing yan" },
			{ id: 4, answer: "计划", meaningHintId: "Rencana", pinyinHint: "ji hua" },
			{ id: 5, answer: "决定", meaningHintId: "Keputusan", pinyinHint: "jue ding" },
			{ id: 6, answer: "准备", meaningHintId: "Persiapan", pinyinHint: "zhun bei" },
			{ id: 7, answer: "联系", meaningHintId: "Menghubungi", pinyinHint: "lian xi" },
			{ id: 8, answer: "帮助", meaningHintId: "Membantu", pinyinHint: "bang zhu" },
			{ id: 9, answer: "完成", meaningHintId: "Menyelesaikan", pinyinHint: "wan cheng" },
			{ id: 10, answer: "提高", meaningHintId: "Meningkatkan", pinyinHint: "ti gao" },
		],
		A2: [
			{ id: 1, answer: "环境", meaningHintId: "Lingkungan", pinyinHint: "huan jing" },
			{ id: 2, answer: "机会", meaningHintId: "Kesempatan", pinyinHint: "ji hui" },
			{ id: 3, answer: "问题", meaningHintId: "Masalah", pinyinHint: "wen ti" },
			{ id: 4, answer: "方法", meaningHintId: "Metode", pinyinHint: "fang fa" },
			{ id: 5, answer: "习惯", meaningHintId: "Kebiasaan", pinyinHint: "xi guan" },
			{ id: 6, answer: "改变", meaningHintId: "Perubahan", pinyinHint: "gai bian" },
			{ id: 7, answer: "坚持", meaningHintId: "Bertahan / konsisten", pinyinHint: "jian chi" },
			{ id: 8, answer: "成功", meaningHintId: "Sukses", pinyinHint: "cheng gong" },
			{ id: 9, answer: "失败", meaningHintId: "Gagal", pinyinHint: "shi bai" },
			{ id: 10, answer: "重要", meaningHintId: "Penting", pinyinHint: "zhong yao" },
		],
		A3: [
			{ id: 1, answer: "我已经准备好了", meaningHintId: "Saya sudah siap", pinyinHint: "wo yi jing zhun bei hao le" },
			{ id: 2, answer: "我们需要讨论", meaningHintId: "Kita perlu diskusi", pinyinHint: "wo men xu yao tao lun" },
			{ id: 3, answer: "请告诉我原因", meaningHintId: "Tolong beri tahu saya alasannya", pinyinHint: "qing gao su wo yuan yin" },
			{ id: 4, answer: "这个问题很复杂", meaningHintId: "Masalah ini rumit", pinyinHint: "zhe ge wen ti hen fu za" },
			{ id: 5, answer: "我想提高水平", meaningHintId: "Saya ingin meningkatkan level", pinyinHint: "wo xiang ti gao shui ping" },
			{ id: 6, answer: "你应该多练习", meaningHintId: "Kamu harus lebih banyak latihan", pinyinHint: "ni ying gai duo lian xi" },
			{ id: 7, answer: "我们一起努力", meaningHintId: "Kita berusaha bersama", pinyinHint: "wo men yi qi nu li" },
			{ id: 8, answer: "他终于成功了", meaningHintId: "Dia akhirnya berhasil", pinyinHint: "ta zhong yu cheng gong le" },
			{ id: 9, answer: "请再解释一次", meaningHintId: "Tolong jelaskan sekali lagi", pinyinHint: "qing zai jie shi yi ci" },
			{ id: 10, answer: "我对结果满意", meaningHintId: "Saya puas dengan hasilnya", pinyinHint: "wo dui jie guo man yi" },
		],
	},
	4: {
		A1: [
			{ id: 1, answer: "沟通", meaningHintId: "Komunikasi", pinyinHint: "gou tong" },
			{ id: 2, answer: "合作", meaningHintId: "Kerja sama", pinyinHint: "he zuo" },
			{ id: 3, answer: "责任", meaningHintId: "Tanggung jawab", pinyinHint: "ze ren" },
			{ id: 4, answer: "效率", meaningHintId: "Efisiensi", pinyinHint: "xiao lv" },
			{ id: 5, answer: "影响", meaningHintId: "Dampak", pinyinHint: "ying xiang" },
			{ id: 6, answer: "压力", meaningHintId: "Tekanan", pinyinHint: "ya li" },
			{ id: 7, answer: "适应", meaningHintId: "Beradaptasi", pinyinHint: "shi ying" },
			{ id: 8, answer: "资源", meaningHintId: "Sumber daya", pinyinHint: "zi yuan" },
			{ id: 9, answer: "管理", meaningHintId: "Manajemen", pinyinHint: "guan li" },
			{ id: 10, answer: "目标", meaningHintId: "Tujuan", pinyinHint: "mu biao" },
		],
		A2: [
			{ id: 1, answer: "优点", meaningHintId: "Kelebihan", pinyinHint: "you dian" },
			{ id: 2, answer: "缺点", meaningHintId: "Kekurangan", pinyinHint: "que dian" },
			{ id: 3, answer: "条件", meaningHintId: "Syarat", pinyinHint: "tiao jian" },
			{ id: 4, answer: "建议", meaningHintId: "Saran", pinyinHint: "jian yi" },
			{ id: 5, answer: "选择", meaningHintId: "Pilihan", pinyinHint: "xuan ze" },
			{ id: 6, answer: "比较", meaningHintId: "Perbandingan", pinyinHint: "bi jiao" },
			{ id: 7, answer: "保持", meaningHintId: "Menjaga", pinyinHint: "bao chi" },
			{ id: 8, answer: "减少", meaningHintId: "Mengurangi", pinyinHint: "jian shao" },
			{ id: 9, answer: "增加", meaningHintId: "Menambah", pinyinHint: "zeng jia" },
			{ id: 10, answer: "安排", meaningHintId: "Mengatur jadwal", pinyinHint: "an pai" },
		],
		A3: [
			{ id: 1, answer: "我们需要有效沟通", meaningHintId: "Kita perlu komunikasi efektif", pinyinHint: "wo men xu yao you xiao gou tong" },
			{ id: 2, answer: "这个方案更合理", meaningHintId: "Rencana ini lebih masuk akal", pinyinHint: "zhe ge fang an geng he li" },
			{ id: 3, answer: "请考虑我的建议", meaningHintId: "Mohon pertimbangkan saran saya", pinyinHint: "qing kao lv wo de jian yi" },
			{ id: 4, answer: "我们按计划进行", meaningHintId: "Kita jalankan sesuai rencana", pinyinHint: "wo men an ji hua jin xing" },
			{ id: 5, answer: "他对结果负责", meaningHintId: "Dia bertanggung jawab atas hasil", pinyinHint: "ta dui jie guo fu ze" },
			{ id: 6, answer: "压力会影响效率", meaningHintId: "Tekanan memengaruhi efisiensi", pinyinHint: "ya li hui ying xiang xiao lv" },
			{ id: 7, answer: "我们必须及时调整", meaningHintId: "Kita harus menyesuaikan tepat waktu", pinyinHint: "wo men bi xu ji shi tiao zheng" },
			{ id: 8, answer: "这个决定很重要", meaningHintId: "Keputusan ini sangat penting", pinyinHint: "zhe ge jue ding hen zhong yao" },
			{ id: 9, answer: "请给我更多信息", meaningHintId: "Tolong beri saya info lebih", pinyinHint: "qing gei wo geng duo xin xi" },
			{ id: 10, answer: "我们达到目标了", meaningHintId: "Kita mencapai tujuan", pinyinHint: "wo men da dao mu biao le" },
		],
	},
}

function parseChapterNumberFromId(chapterId?: string): number | null {
	if (!chapterId) return null
	const m = chapterId.match(/ch(\d+)/i)
	if (!m) return null
	const n = parseInt(m[1], 10)
	if (Number.isNaN(n)) return null
	return n
}

// Small deterministic PRNG (mulberry32) for reproducible shuffles per chapter
function mulberry32(seed: number) {
	return function () {
		let t = (seed += 0x6d2b79f5)
		t = Math.imul(t ^ (t >>> 15), t | 1)
		t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
		return ((t ^ (t >>> 14)) >>> 0) / 4294967296
	}
}

function seededShuffle<T>(arr: T[], seed: number) {
	const result = arr.slice()
	const rand = mulberry32(seed)
	for (let i = result.length - 1; i > 0; i--) {
		const j = Math.floor(rand() * (i + 1))
		const tmp = result[i]
		result[i] = result[j]
		result[j] = tmp
	}
	return result
}

/**
 * Get the 10-question set for a given HSK level, assignment level, and optional chapter id.
 * If the bank for that HSK/assignment contains more than 10 items, this will deterministically
 * pick a chapter-specific slice using a seeded shuffle so each chapter yields a different set.
 */
export function getMandarinTypingQuestions(
	hskLevel: SupportedHskLevel,
	assignmentLevel: AssignmentALevel,
	chapterId?: string
): MandarinTypingQuestion[] {
	const pool = mandarinTypingQuestionSets[hskLevel][assignmentLevel]
	const chapterNumber = parseChapterNumberFromId(chapterId) ?? 1

	// If pool already exactly 10, rotate deterministically by chapterNumber
	if (pool.length === 10) {
		const rotated = pool.slice((chapterNumber - 1) % pool.length).concat(
			pool.slice(0, (chapterNumber - 1) % pool.length)
		)
		return rotated
	}

	// If pool larger than 10, pick via seeded shuffle
	if (pool.length > 10) {
		const shuffled = seededShuffle(pool, chapterNumber)
		return shuffled.slice(0, 10)
	}

	// If pool smaller than 10, just return pool (caller should handle length)
	return pool
}
