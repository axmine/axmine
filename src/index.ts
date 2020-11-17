// time format
import { formatDate } from './utils/formatDate'
// get variable's type
import { getType } from './utils/getType'
// cookie
import Store from './utils/store'
import Cookie from './utils/cookie'
// validate
import { validate } from './utils/validate'
// random
import { random } from './utils/random'

//camelCase
import { camelCase } from './utils/camelCase'

// vuex
import vuex from './utils/vuex'

export default {
  formatDate,
  getType,
  store: new Store(),
  cookie: Cookie,
  validate,
  random,
  camelCase,
  vuex
}