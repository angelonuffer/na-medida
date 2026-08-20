document.addEventListener('DOMContentLoaded', () => {
    // Seleciona todos os botões de navegação e seções de página
    const navButtons = document.querySelectorAll('.nav-btn');
    const pageSections = document.querySelectorAll('.page-section');

    // Função para alterar a página ativa
    function navigateToPage(pageId) {
        // 1. Remove a classe 'active' de todos os botões e seções
        navButtons.forEach(btn => btn.classList.remove('active'));
        pageSections.forEach(section => section.classList.remove('active'));

        // 2. Adiciona a classe 'active' ao botão clicado correspondente
        const activeBtn = document.querySelector(`.nav-btn[data-page="${pageId}"]`);
        if (activeBtn) {
            activeBtn.classList.add('active');
        }

        // 3. Mostra a seção correspondente
        const activeSection = document.getElementById(pageId);
        if (activeSection) {
            activeSection.classList.add('active');
        }
    }

    // Adiciona evento de clique para cada botão do menu lateral
    navButtons.forEach(button => {
        button.addEventListener('click', (e) => {
            const pageId = button.getAttribute('data-page');
            navigateToPage(pageId);
        });
    });
});
