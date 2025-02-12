// ***********************************************
// This example commands.js shows you how to
// create various custom commands and overwrite
// existing commands.
//
// For more comprehensive examples of custom
// commands please read more here:
// https://on.cypress.io/custom-commands
// ***********************************************
//
//
// -- This is a parent command --
// Cypress.Commands.add("login", (email, password) => { ... })
//
//
// -- This is a child command --
// Cypress.Commands.add("drag", { prevSubject: 'element'}, (subject, options) => { ... })
//
//
// -- This is a dual command --
// Cypress.Commands.add("dismiss", { prevSubject: 'optional'}, (subject, options) => { ... })
//
//
// -- This is will overwrite an existing command --
// Cypress.Commands.overwrite("visit", (originalFn, url, options) => { ... })
import 'cypress-file-upload'
Cypress.Commands.add(
  'dataCy',
  {
    prevSubject: 'optional'
  },
  (subject, value) => {
    return cy.get(`[data-cy=${value}]`, {
      withinSubject: subject
    })
  }
)

Cypress.Commands.add('testRoute', (route) => {
  cy.location().should((loc) => {
    if (loc.hash.length > 0) {
      // Vue-Router in hash mode
      expect(loc.hash).to.contain(route)
    } else {
      // Vue-Router in history mode
      expect(loc.pathname).to.contain(route)
    }
  })
})

// these two commands let you persist local storage between tests
const LOCAL_STORAGE_MEMORY = {}

Cypress.Commands.add('saveLocalStorage', () => {
  Object.keys(localStorage).forEach((key) => {
    LOCAL_STORAGE_MEMORY[key] = localStorage[key]
  })
})

Cypress.Commands.add('restoreLocalStorage', () => {
  Object.keys(LOCAL_STORAGE_MEMORY).forEach((key) => {
    localStorage.setItem(key, LOCAL_STORAGE_MEMORY[key])
  })
})

// jump page command
Cypress.Commands.add('toSignIn', () => {
  cy.get('[aria-label="Menu"]').click()
  cy.get('.left-drawer-header').contains('Sign in').click()
  // cy.location('pathname', { timeout: 10000 }).should('eq', '/account')
  cy.get('.q-card', { timeout: 3000 }).should('be.visible')
})
Cypress.Commands.add('toCredits', () => {
  cy.get('[aria-label="Menu"]').click()
  cy.get('.q-drawer__content').contains('Credits').click()
  cy.get('.q-linear-progress__model', { timeout: 10000 }).should('be.visible')
  cy.get('.q-linear-progress__model', { timeout: 10000 }).should('not.exist')
})
Cypress.Commands.add('toMoreHoriz', () => {
  cy.get('[aria-label="Menu"]').click()
  cy.contains('more_horiz', { timeout: 20000 }).click()
  cy.get('[data-cy=account-settings-btn]').click()
})
Cypress.Commands.add('toBasic', () => {
  cy.get('[aria-label="Menu"]').click()
  cy.contains('Basic').then(($element) => {
    if (!$element.is(':visible')) {
      cy.contains('Settings').click()
    }
  })
  cy.contains('Basic').click()
})
// cacheSession = true => call session()
// cacheSession = true => call session()
Cypress.Commands.add('signIn', (username, password, { cacheSession = true } = {}) => {
  const login = () => {
    cy.visit('/')
    cy.get('.q-card', { timeout: 5000 }).then(($element) => {
      if (!$element.is(':visible')) {
        // toggle sign in page
        cy.toSignIn()
        // sign in start
      }
    })
    let user
    if (/@/.test(username)) {
      user = username
    } else {
      user = '+1' + Cypress.env(username)
    }
    cy.contains('Phone number or email').type('{selectall}{backspace}').type(user, { log: false })
    cy.contains('Password').type('{selectall}{backspace}').type(Cypress.env(password), { log: false })
    cy.get('.q-card__actions').contains('Sign in').click()
    // wait page jump
    cy.get('.q-notification__message', { timeout: 60000 * 2 }).should('be.visible')
    cy.get('body').then($body => {
      if ($body.find('.q-notification__message').length > 0) {
        // evaluates as true if button exists at all
        cy.get('.q-notification__message').then($header => {
          if ($header.is(':visible')) {
            // you get here only if button EXISTS and is VISIBLE
            const text = $header.text()
            cy.log(text)
            cy.task('log', 'alert:' + text)
            if (/There is a problem with the network, please try again later/.test(text) ||
              /Pending sign-in attempt already in progress/.test(text) ||
              /reCAPTCHA verification error/.test(text)) {
              cy.log('text is There is a problem with the network')
              cy.get('.q-notification__message', { timeout: 60000 * 2 }).should('not.be.visible')
              cy.get('.q-card__actions').contains('Sign in').click()
            } else {
              cy.log('text is not network')
            }
          }
        })
      } else {
        // you get here if the button DOESN'T EXIST
        assert.isOk('everything', 'everything is OK')
      }
    })
    cy.get('.q-notification__message', { timeout: 60000 * 2 }).should('have.text', 'Signed in')
    cy.toMoreHoriz()
    // cy.location('pathname', { timeout: 30000 }).should('eq', '/account/settings')
    // sign in end
  }
  if (cacheSession) {
    cy.session([username, password], login, {
      validate () {
        cy.visit('/')
        let user
        if (/@/.test(username)) {
          user = username
        } else {
          user = '+1' + Cypress.env(username)
        }
        cy.toMoreHoriz()
        // cy.location('pathname', { timeout: 12000 }).should('eq', '/account/settings')
        cy.get('.account-setting__verification').contains(user)
      }
    })
    cy.visit('/')
    cy.toMoreHoriz()
    // cy.location('pathname', { timeout: 12000 }).should('eq', '/account/settings')
  } else {
    login()
  }
})
Cypress.Commands.add('signOut', () => {
  cy.get('[aria-label="Menu"]').then(($el) => {
    const isVisible = Cypress.dom.isVisible($el)
    cy.log('isVisible:' + isVisible)
    if (isVisible) {
      cy.get('[aria-label="Menu"]').click()
    } // true
  })
  cy.contains('more_horiz').click()
  cy.get("[data-cy='sign-out-btn']").click()
  cy.contains('Sign out anyway').click()
  cy.contains('Signed out', { timeout: 30000 }).should('be.visible')
})

Cypress.Commands.add('getAccountStatus', () => {
  cy.sleep(1000)
  cy.get('.left-drawer-header').then(($el) => {
    const isVisible = Cypress.dom.isVisible($el)
    cy.log('isVisible' + isVisible)
    if (!isVisible) {
      cy.get('[aria-label="Menu"]').click()
    } // true
  })
  cy.get('.left-drawer-header').then(($div) => {
    const text = $div.text()
    cy.log(text)
    // cy.log(/Lv/.test(text))
    expect(text).to.match(/Lv/)
  })
})

// credits command
Cypress.Commands.add('transfer', (ID, amount) => {
  // 转账 start
  cy.get('button').contains('Transfer').click()
  // cy.get('.q-card:nth-child(2) > .q-card__section:nth-child(1) > :nth-child(1)').click()
  cy.get('.q-dialog__inner > .q-card', { timeout: 5000 }).should('be.visible').then($card => {
    cy.get('[aria-label="Receipt Code"]').then($input => {
      cy.log('111:' + $input.val())
      if ($input.val() === '') cy.get('[aria-label="Receipt Code"]').type(ID)
    })
    cy.get('[aria-label="Transfer Amount"]').type(amount)
    cy.get('.q-form >> button').contains('Transfer').click()
  })
  // 等待 q-card 退出
  cy.get('.q-dialog__inner > .q-card', { timeout: 20000 }).should('not.exist')
  // 转账 end
  cy.sleep(500)
})

// util command
Cypress.Commands.add('sleep', (ms) => {
  return new Promise(resolve => setTimeout(resolve, ms))
})
Cypress.Commands.add('times', (times, callback) => {
  for (let n = 0; n < times; n++) {
    cy.log('The' + n + 'cycle')
    callback && callback()
  }
})
