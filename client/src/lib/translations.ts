export type Language = 'de' | 'en';

export const translations = {
  de: {
    // Start page
    startPage: {
      title: 'Willkommen bei ForzaCheck',
      subtitle: 'Wählen Sie Ihre Rolle aus',
      roles: {
        employee: 'Mitarbeiter',
        employeeDesc: 'Checklisten ausfüllen',
        teig: 'Teig',
        teigDesc: 'Teig-Produktion anzeigen',
        manager: 'Betriebsleiter',
        managerDesc: 'Management-Aufgaben',
        admin: 'Admin',
        adminDesc: 'System verwalten',
        language: 'Sprache',
        languageDesc: 'Language/Sprache'
      }
    },
    // Employee workflow
    employee: {
      storeSelection: {
        title: 'Store auswählen',
        selectStore: 'Wählen Sie einen Store'
      },
      areaSelection: {
        title: 'Arbeitsbereich auswählen',
        selectArea: 'Wählen Sie einen Bereich',
        areas: {
          'Terminal': 'Terminal',
          'Küche': 'Küche',
          'Fahrer': 'Fahrer',
          'Betriebsleiter': 'Betriebsleiter',
          'Sonder/Samstagsreinigung': 'Sonder/Samstagsreinigung',
          'Inventur/Non-Food': 'Inventur/Non-Food',
          'Inventur': 'Inventur'
        }
      },
      detailsEntry: {
        title: 'Details eingeben',
        employeeName: 'Mitarbeitername',
        enterName: 'Geben Sie Ihren Namen ein',
        shift: 'Schicht',
        earlyShift: 'Frühschicht',
        lateShift: 'Spätschicht',
        shiftPhase: 'Schichtphase',
        shiftStart: 'Schichtanfang',
        shiftEnd: 'Schichtende'
      },
      shiftPhase: {
        title: 'Schichtphase auswählen',
        youSelected: 'Sie haben',
        areYouAt: 'Sind Sie am',
        or: 'oder am',
        ofShift: 'der Schicht',
        start: 'Start',
        end: 'Ende',
        ofThe: 'der',
        differentTasks: 'Je nach Schichtphase erhalten Sie unterschiedliche Aufgaben zur Bearbeitung.',
        continueToTasks: 'Weiter zu den Aufgaben'
      },
      taskCompletion: {
        title: 'Aufgaben abschließen',
        markComplete: 'Alle auswählen',
        unmarkAll: 'Alle abwählen',
        completed: 'erledigt',
        submit: 'Checkliste einreichen',
        confirmSubmit: 'Sind Sie sicher, dass Sie die Checkliste einreichen möchten?'
      },
      inventory: {
        title: 'Inventur',
        enterQuantity: 'Menge eingeben',
        product: 'Produkt',
        quantity: 'Menge',
        save: 'Speichern'
      },
      success: {
        title: 'Erfolgreich eingereicht!',
        message: 'Ihre Checkliste wurde erfolgreich eingereicht.',
        newChecklist: 'Neue Checkliste starten',
        backToStart: 'Zur Startseite'
      }
    },
    // Teig Dashboard
    teig: {
      title: 'Teig-Produktion',
      today: 'heute',
      tomorrow: 'morgen',
      totalToday: 'Gesamt Kugelmenge heute',
      totalTomorrow: 'Gesamt Kugelmenge morgen',
      allStores: 'Alle Stores',
      store: 'Store',
      balls: 'Kugeln',
      planned: 'geplant',
      noProduction: 'Keine Teig-Produktion geplant',
      breakdown: 'Aufschlüsselung nach Store'
    },
    // Admin Dashboard
    admin: {
      title: 'Admin Dashboard',
      tabs: {
        overview: 'Übersicht',
        areas: 'Arbeitsbereiche',
        tasks: 'Aufgaben',
        submitted: 'Eingereichte Listen',
        teigPlanning: 'Teig-Planung'
      },
      overview: {
        totalChecklists: 'Checklisten gesamt',
        completedToday: 'Heute erledigt',
        categories: 'Arbeitsbereiche',
        totalTasks: 'Aufgaben gesamt',
        statistics: 'Statistiken'
      },
      areas: {
        title: 'Arbeitsbereiche verwalten',
        addNew: 'Neuer Arbeitsbereich',
        name: 'Name',
        type: 'Typ',
        withShifts: 'Mit Schichten',
        simpleChecklist: 'Einfache Checkliste',
        withQuantity: 'Mit Mengenerfassung',
        delete: 'Löschen',
        confirmDelete: 'Sind Sie sicher, dass Sie diesen Arbeitsbereich löschen möchten?'
      },
      tasks: {
        title: 'Aufgaben verwalten',
        addNew: 'Neue Aufgabe',
        name: 'Aufgabenname',
        category: 'Arbeitsbereich',
        priority: 'Priorität',
        stores: 'Stores',
        actions: 'Aktionen',
        edit: 'Bearbeiten',
        delete: 'Löschen',
        confirmDelete: 'Sind Sie sicher, dass Sie diese Aufgabe löschen möchten?'
      },
      submitted: {
        title: 'Eingereichte Checklisten',
        employee: 'Mitarbeiter',
        store: 'Store',
        area: 'Bereich',
        shift: 'Schicht',
        tasks: 'Aufgaben',
        date: 'Datum',
        actions: 'Aktionen',
        view: 'Anzeigen',
        delete: 'Löschen',
        filter: {
          allStores: 'Alle Stores',
          today: 'Heute',
          yesterday: 'Gestern',
          dayBeforeYesterday: 'Vorgestern',
          threeDaysAgo: 'Vor 3 Tagen',
          fourDaysAgo: 'Vor 4 Tagen',
          allTime: 'Alle Daten'
        }
      },
      teigPlanning: {
        title: 'Teig-Kugelmenge Planung',
        currentWeek: 'Aktuelle Woche',
        previousWeek: 'Vorherige Woche',
        nextWeek: 'Nächste Woche',
        enterQuantity: 'Geben Sie die zu produzierende Kugelmenge pro Tag und Store ein.',
        save: 'Speichern'
      }
    },
    // Common
    common: {
      back: 'Zurück',
      backToStart: 'Zurück zur Startseite',
      next: 'Weiter',
      submit: 'Einreichen',
      cancel: 'Abbrechen',
      save: 'Speichern',
      delete: 'Löschen',
      edit: 'Bearbeiten',
      loading: 'Laden...',
      error: 'Fehler',
      success: 'Erfolgreich',
      confirm: 'Bestätigen',
      yes: 'Ja',
      no: 'Nein',
      all: 'Alle',
      none: 'Keine',
      select: 'Auswählen',
      search: 'Suchen',
      filter: 'Filtern',
      noData: 'Keine Daten vorhanden',
      close: 'Schließen'
    }
  },
  en: {
    // Start page
    startPage: {
      title: 'Welcome to ForzaCheck',
      subtitle: 'Select your role',
      roles: {
        employee: 'Employee',
        employeeDesc: 'Complete checklists',
        teig: 'Dough',
        teigDesc: 'View dough production',
        manager: 'Manager',
        managerDesc: 'Management tasks',
        admin: 'Admin',
        adminDesc: 'Manage system',
        language: 'Language',
        languageDesc: 'Language/Sprache'
      }
    },
    // Employee workflow
    employee: {
      storeSelection: {
        title: 'Select Store',
        selectStore: 'Choose a store'
      },
      areaSelection: {
        title: 'Select Work Area',
        selectArea: 'Choose an area',
        areas: {
          'Terminal': 'Terminal',
          'Küche': 'Kitchen',
          'Fahrer': 'Driver',
          'Betriebsleiter': 'Manager',
          'Sonder/Samstagsreinigung': 'Special/Saturday Cleaning',
          'Inventur/Non-Food': 'Inventory/Non-Food',
          'Inventur': 'Inventory'
        }
      },
      detailsEntry: {
        title: 'Enter Details',
        employeeName: 'Employee Name',
        enterName: 'Enter your name',
        shift: 'Shift',
        earlyShift: 'Early Shift',
        lateShift: 'Late Shift',
        shiftPhase: 'Shift Phase',
        shiftStart: 'Shift Start',
        shiftEnd: 'Shift End'
      },
      shiftPhase: {
        title: 'Select Shift Phase',
        youSelected: 'You selected',
        areYouAt: 'Are you at the',
        or: 'or the',
        ofShift: 'of the shift',
        start: 'Start',
        end: 'End',
        ofThe: 'of the',
        differentTasks: 'You will receive different tasks depending on the shift phase.',
        continueToTasks: 'Continue to Tasks'
      },
      taskCompletion: {
        title: 'Complete Tasks',
        markComplete: 'Select All',
        unmarkAll: 'Deselect All',
        completed: 'completed',
        submit: 'Submit Checklist',
        confirmSubmit: 'Are you sure you want to submit the checklist?'
      },
      inventory: {
        title: 'Inventory',
        enterQuantity: 'Enter quantity',
        product: 'Product',
        quantity: 'Quantity',
        save: 'Save'
      },
      success: {
        title: 'Successfully Submitted!',
        message: 'Your checklist has been successfully submitted.',
        newChecklist: 'Start New Checklist',
        backToStart: 'Back to Start'
      }
    },
    // Teig Dashboard
    teig: {
      title: 'Dough Production',
      today: 'today',
      tomorrow: 'tomorrow',
      totalToday: 'Total ball quantity today',
      totalTomorrow: 'Total ball quantity tomorrow',
      allStores: 'All Stores',
      store: 'Store',
      balls: 'Balls',
      planned: 'planned',
      noProduction: 'No dough production planned',
      breakdown: 'Breakdown by Store'
    },
    // Admin Dashboard
    admin: {
      title: 'Admin Dashboard',
      tabs: {
        overview: 'Overview',
        areas: 'Work Areas',
        tasks: 'Tasks',
        submitted: 'Submitted Lists',
        teigPlanning: 'Dough Planning'
      },
      overview: {
        totalChecklists: 'Total Checklists',
        completedToday: 'Completed Today',
        categories: 'Work Areas',
        totalTasks: 'Total Tasks',
        statistics: 'Statistics'
      },
      areas: {
        title: 'Manage Work Areas',
        addNew: 'New Work Area',
        name: 'Name',
        type: 'Type',
        withShifts: 'With Shifts',
        simpleChecklist: 'Simple Checklist',
        withQuantity: 'With Quantity Entry',
        delete: 'Delete',
        confirmDelete: 'Are you sure you want to delete this work area?'
      },
      tasks: {
        title: 'Manage Tasks',
        addNew: 'New Task',
        name: 'Task Name',
        category: 'Work Area',
        priority: 'Priority',
        stores: 'Stores',
        actions: 'Actions',
        edit: 'Edit',
        delete: 'Delete',
        confirmDelete: 'Are you sure you want to delete this task?'
      },
      submitted: {
        title: 'Submitted Checklists',
        employee: 'Employee',
        store: 'Store',
        area: 'Area',
        shift: 'Shift',
        tasks: 'Tasks',
        date: 'Date',
        actions: 'Actions',
        view: 'View',
        delete: 'Delete',
        filter: {
          allStores: 'All Stores',
          today: 'Today',
          yesterday: 'Yesterday',
          dayBeforeYesterday: 'Day Before Yesterday',
          threeDaysAgo: '3 Days Ago',
          fourDaysAgo: '4 Days Ago',
          allTime: 'All Data'
        }
      },
      teigPlanning: {
        title: 'Dough Ball Quantity Planning',
        currentWeek: 'Current Week',
        previousWeek: 'Previous Week',
        nextWeek: 'Next Week',
        enterQuantity: 'Enter the ball quantity to be produced per day and store.',
        save: 'Save'
      }
    },
    // Common
    common: {
      back: 'Back',
      backToStart: 'Back to Start',
      next: 'Next',
      submit: 'Submit',
      cancel: 'Cancel',
      save: 'Save',
      delete: 'Delete',
      edit: 'Edit',
      loading: 'Loading...',
      error: 'Error',
      success: 'Success',
      confirm: 'Confirm',
      yes: 'Yes',
      no: 'No',
      all: 'All',
      none: 'None',
      select: 'Select',
      search: 'Search',
      filter: 'Filter',
      noData: 'No data available',
      close: 'Close'
    }
  }
};

export function getTranslations(language: Language) {
  return translations[language];
}