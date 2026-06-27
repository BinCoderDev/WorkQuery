const cloud = require('wx-server-sdk')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()

exports.main = async (event, context) => {
  try {
    const { data } = await db.collection('banks')
      .where({ isActive: true })
      .orderBy('order', 'asc')
      .get()

    return { code: 0, data }
  } catch (e) {
    console.error('getBanks error:', e)
    return { code: -1, message: e.message }
  }
}
