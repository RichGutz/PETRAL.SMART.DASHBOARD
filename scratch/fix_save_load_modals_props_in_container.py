path = r'C:\Users\rguti\PETRAL.SMART.DASHBOARD\Desarrollo.Profesional\Geeksoft_Frontend\src\components\CommercialForecast\MultiCotizadorExcel.tsx'

with open(path, 'r', encoding='utf-8') as f:
    code = f.read()

old_modals_call = """            {/* MODALES DE GRABAR Y CARGAR PERSISTENTES */}
            <SaveLoadQuoteModals
                showSaveModal={showSaveModal}
                showLoadModal={showLoadModal}
                routeName={routeName}
                isSaving={isSaving}
                isLoadingRoutes={isLoadingRoutes}
                savedRoutes={savedRoutes}
                selectedClient={selectedClient}
                setShowSaveModal={setShowSaveModal}
                setShowLoadModal={setShowLoadModal}
                setRouteName={setRouteName}
                handleSaveRoute={handleSaveRoute}
                handleLoadRoute={handleLoadRoute}
                handlePrintPDF={handlePrintPDF}
                getSuggestedRouteName={getSuggestedRouteName}
            />"""

new_modals_call = """            {/* MODALES DE GRABAR Y CARGAR PERSISTENTES */}
            <SaveLoadQuoteModals
                showSaveModal={showSaveModal}
                showLoadModal={showLoadModal}
                routeName={routeName}
                isSaving={isSaving}
                isLoadingRoutes={isLoadingRoutes}
                savedRoutes={savedRoutes}
                setShowSaveModal={setShowSaveModal}
                setShowLoadModal={setShowLoadModal}
                setRouteName={setRouteName}
                handleSaveRoute={handleSaveRoute}
                handleLoadRoute={handleLoadRoute}
            />"""

code = code.replace(old_modals_call, new_modals_call)

with open(path, 'w', encoding='utf-8') as f:
    f.write(code)

print("CONTAINER MODALS INVOCATION FIXED SUCCESSFULLY!")
