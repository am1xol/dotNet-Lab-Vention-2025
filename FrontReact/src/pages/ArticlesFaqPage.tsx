import React, { useState } from 'react';
import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Tabs,
  Tab,
  Chip,
  Stack,
  Button,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ArticleIcon from '@mui/icons-material/Article';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { useNavigate } from 'react-router-dom';
import { translations } from '../i18n/translations';

interface Article {
  id: string;
  title: string;
  preview: string;
  content: string;
  category: string;
}

interface FaqItem {
  id: string;
  question: string;
  answer: string;
  category: string;
}

// Данные статей
const articlesData: Article[] = [
  {
    id: '1',
    title: 'Как начать работу с SubscriptionManager',
    preview: 'Узнайте, как быстро и легко настроить управление вашими подписками на стриминговые сервисы.',
    content: `
      <h3>Регистрация</h3>
      <p>Для начала работы нажмите кнопку "Регистрация" на главной странице и заполните форму: введите email, пароль. После регистрации вам на почту придёт код подтверждения.</p>
      
      <h3>Вход в систему</h3>
      <p>После подтверждения email войдите в систему, используя ваш email и пароль. Система запомнит вас, если вы отметите галочку "Запомнить меня".</p>
      
      <h3>Просмотр доступных подписок</h3>
      <p>Перейдите в раздел "Доступные подписки" в панели управления. Здесь вы найдёте каталог популярных стриминговых сервисов: Netflix, Spotify, YouTube Premium, Twitch и другие.</p>
      
      <h3>Оформление подписки</h3>
      <p>Выберите интересующий вас сервис, укажите желаемый тарифный план (месячный или годовой) и оплатите картой. После успешной оплаты подписка появится в разделе "Мои подписки".</p>
    `,
    category: 'Начало работы',
  },
  {
    id: '2',
    title: 'Безопасность данных и платежей',
    preview: 'Как мы защищаем вашу личную информацию и обеспечиваем безопасность платежей.',
    content: `
      <h3>Защита персональных данных</h3>
      <p>Все ваши персональные данные, включая email и платёжную информацию, хранятся в зашифрованном виде. Мы используем современные протоколы шифрования, соответствующие международным стандартам.</p>
      
      <h3>Безопасные платежи</h3>
      <p>Мы не храним данные ваших банковских карт. Все платежи обрабатываются через защищённый платёжный шлюз BePaid. При оплате вы вводите данные карты непосредственно на странице платёжной системы.</p>
      
      <h3>Защита аккаунта</h3>
      <p>Рекомендуем использовать сложный пароль и регулярно его менять. При подозрительной активности система может запросить дополнительное подтверждение.</p>
      
      <h3>Конфиденциальность</h3>
      <p>Мы не передаём ваши данные третьим лицам в маркетинговых целях.</p>
    `,
    category: 'Безопасность',
  },
  {
    id: '3',
    title: 'Управление активными подписками',
    preview: 'Как отслеживать, изменять и отменять ваши активные подписки.',
    content: `
      <h3>Просмотр активных подписок</h3>
      <p>В разделе "Мои подписки" отображаются все ваши активные подписки. Для каждой подписки показаны: название сервиса, тарифный план, дата следующего списания и сумма.</p>
      
      <h3>Отмена подписки</h3>
      <p>Чтобы отменить подписку, нажмите на неё в разделе "Мои подписки" и выберите "Отменить подписку". Система попросит указать причину отмены. Отмена вступит в силу в конце текущего платёжного периода.</p>
    `,
    category: 'Подписки',
  },
  {
    id: '4',
    title: 'История платежей и отчёты',
    preview: 'Как просматривать историю платежей и формировать отчёты о расходах.',
    content: `
      <h3>История платежей</h3>
      <p>В разделе "История платежей" отображаются все транзакции: успешные и неуспешные. Для каждого платежа указаны: дата, сумма, сервис и статус.</p>
      
      <h3>Формирование отчётов</h3>
      <p>Администраторы могут формировать аналитические отчёты в формате CSV или Word. Доступны отчёты по активным подпискам, популярности сервисов и финансовой статистике.</p>
      
      <h3>Статистика расходов</h3>
      <p>В разделе "Статистика" вы увидите общую сумму расходов за месяц и год.</p>
    `,
    category: 'Финансы',
  },
  {
    id: '5',
    title: 'Настройка уведомлений',
    preview: 'Как настроить получение уведомлений о платежах, напоминаниях и обновлениях.',
    content: `
      <h3>Типы уведомлений</h3>
      <p>Система отправляет уведомления о успешном продлении, отмене подписки.</p>
      
      <h3>Напоминания о платежах</h3>
      <p>Вы получаете напоминание при завершении срока действия подписки.</p>
      
      <h3>Уведомления чата поддержки</h3>
      <p>При обращении в чат поддержки вы будете получать уведомления о новых сообщениях. Чат доступен в виджете в правом нижнем углу экрана.</p>
    `,
    category: 'Настройки',
  },
];

// Данные FAQ
const faqData: FaqItem[] = [
  {
    id: '1',
    question: 'Как оформить подписку на новый сервис?',
    answer: 'Перейдите в раздел "Доступные подписки", найдите нужный сервис и выберите тарифный план (месячный или годовой), укажите данные карты для оплаты и подтвердите платёж. После успешной оплаты подписка активируется мгновенно.',
    category: 'Подписки',
  },
  {
    id: '2',
    question: 'Как отменить активную подписку?',
    answer: 'Откройте раздел "Мои подписки", найдите нужную подписку, нажмите "Отменить подписку" и выберите причину отмены из списка. Подписка будет действовать до конца оплаченного периода.',
    category: 'Подписки',
  },
  {
    id: '3',
    question: 'Какие способы оплаты поддерживаются?',
    answer: 'Мы поддерживаем оплату банковскими картами Visa, Mastercard и Мир. Все платежи обрабатываются через защищённый платёжный шлюз.',
    category: 'Оплата',
  },
  {
    id: '4',
    question: 'Можно ли изменить тарифный план подписки?',
    answer: 'Да, вы можете перейти на другой тарифный план после завершения текущего. Например, с месячного на годовой или наоборот.',
    category: 'Подписки',
  },
  {
    id: '5',
    question: 'Что происходит при неудачном платеже?',
    answer: 'Если платёж не пройдёт, вы получите уведомление на email.',
    category: 'Оплата',
  },
  {
    id: '6',
    question: 'Как связаться со службой поддержки?',
    answer: 'Используйте виджет чата в левом нижнем углу экрана для быстрой связи с оператором. Среднее время ответа составляет несколько минут.',
    category: 'Поддержка',
  },
  {
    id: '7',
    question: 'Возвращаются ли деньги при отмене подписки?',
    answer: 'Возврат осуществляется в соответствии с политикой конкретного сервиса. При отмене подписки деньги за текущий период не возвращаются, но услуга остаётся доступной до конца оплаченного срока.',
    category: 'Оплата',
  }
];

const ArticlesFaqPage: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState(0);
  const [expandedFaq, setExpandedFaq] = useState<string | false>(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('Все');
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);

  const categories = ['Все', 'Начало работы', 'Безопасность', 'Подписки', 'Финансы', 'Настройки'];
  const faqCategories = ['Все', 'Подписки', 'Оплата', 'Поддержка', 'Данные', 'Настройки'];

  const filteredArticles = selectedCategory === 'Все'
    ? articlesData
    : articlesData.filter(article => article.category === selectedCategory);

  const handleFaqChange = (panelId: string) => (
    _event: React.SyntheticEvent,
    isExpanded: boolean
  ) => {
    setExpandedFaq(isExpanded ? panelId : false);
  };

  const filteredFaqs = selectedCategory === 'Все'
    ? faqData
    : faqData.filter(faq => faq.category === selectedCategory);

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #F5F3FF 0%, #EDE7F6 50%, #E8EAF6 100%)',
        pb: 8,
      }}
    >
      {/* Header */}
      <Box
        sx={{
          background: 'rgba(255, 255, 255, 0.9)',
          backdropFilter: 'blur(25px)',
          borderRadius: 2,
          mx: 'auto',
          mt: 3,
          maxWidth: '95%',
          py: 2,
          px: 3,
          display: 'flex',
          alignItems: 'center',
          gap: 2,
          boxShadow: '0 4px 20px rgba(126, 87, 194, 0.1)',
        }}
      >
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/')}
          sx={{
            color: '#7E57C2',
            '&:hover': {
              backgroundColor: 'rgba(126, 87, 194, 0.08)',
            },
          }}
        >
          {translations.common.back}
        </Button>
        <Typography
          variant="h5"
          sx={{
            fontWeight: 700,
            background: 'linear-gradient(135deg, #7E57C2 0%, #B39DDB 100%)',
            backgroundClip: 'text',
            WebkitBackgroundClip: 'text',
            color: 'transparent',
            flexGrow: 1,
            textAlign: 'center',
          }}
        >
          {translations.articlesFaq?.title || 'Статьи и FAQ'}
        </Typography>
        <Box sx={{ width: 100 }} />
      </Box>

      <Container maxWidth="lg" sx={{ mt: 4 }}>
        {/* Tabs */}
        <Card 
          sx={{ 
            mb: 4, 
            overflow: 'hidden',
            backgroundColor: 'rgba(255, 255, 255, 0.95)',
            boxShadow: '0 4px 20px rgba(126, 87, 194, 0.1)',
          }}
        >
          <Tabs
            value={activeTab}
            onChange={(_, newValue) => {
              setActiveTab(newValue);
              setSelectedCategory('Все');
              setSelectedArticle(null);
            }}
            sx={{
              '& .MuiTab-root': {
                fontWeight: 600,
                fontSize: '1rem',
                color: '#7E57C2',
                minWidth: 120,
                px: 3,
                '&.Mui-selected': {
                  color: '#5E35B1',
                },
              },
              '& .MuiTabs-indicator': {
                backgroundColor: '#7E57C2',
                height: 3,
                borderRadius: '3px 3px 0 0',
              },
              '& .MuiTabs-flexContainer': {
                borderBottom: '1px solid rgba(126, 87, 194, 0.1)',
              },
            }}
          >
            <Tab
              icon={<ArticleIcon />}
              iconPosition="start"
              label={translations.articlesFaq?.articles || 'Статьи'}
            />
            <Tab
              icon={<HelpOutlineIcon />}
              iconPosition="start"
              label="FAQ"
            />
          </Tabs>
        </Card>

        {/* Articles Tab */}
        {activeTab === 0 && !selectedArticle && (
          <>
            {/* Category Filter */}
            <Stack direction="row" spacing={1} sx={{ mb: 3, flexWrap: 'wrap', gap: 1 }}>
              {categories.map((category) => (
                <Chip
                  key={category}
                  label={category}
                  onClick={() => setSelectedCategory(category)}
                  sx={{
                    backgroundColor: selectedCategory === category
                      ? '#7E57C2'
                      : 'rgba(255, 255, 255, 0.9)',
                    color: selectedCategory === category ? '#fff' : '#7E57C2',
                    fontWeight: 600,
                    border: '1px solid rgba(126, 87, 194, 0.3)',
                    '&:hover': {
                      backgroundColor: selectedCategory === category
                        ? '#5E35B1'
                        : 'rgba(126, 87, 194, 0.15)',
                    },
                  }}
                />
              ))}
            </Stack>

            {/* Articles Grid */}
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: {
                  xs: '1fr',
                  md: 'repeat(2, 1fr)',
                  lg: 'repeat(3, 1fr)',
                },
                gap: 3,
              }}
            >
              {filteredArticles.map((article) => (
                <Card
                  key={article.id}
                  sx={{
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    backgroundColor: 'rgba(255, 255, 255, 0.95)',
                    boxShadow: '0 4px 15px rgba(126, 87, 194, 0.1)',
                    '&:hover': {
                      transform: 'translateY(-4px)',
                      boxShadow: '0 8px 25px rgba(126, 87, 194, 0.25)',
                    },
                  }}
                  onClick={() => setSelectedArticle(article)}
                >
                  <CardContent>
                    <Chip
                      label={article.category}
                      size="small"
                      sx={{
                        mb: 2,
                        backgroundColor: 'rgba(126, 87, 194, 0.1)',
                        color: '#7E57C2',
                        fontWeight: 600,
                      }}
                    />
                    <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>
                      {article.title}
                    </Typography>
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ mb: 2 }}
                    >
                      {article.preview}
                    </Typography>
                    <Typography 
                      variant="caption" 
                      sx={{ 
                        color: '#7E57C2',
                        fontWeight: 600,
                      }}
                    >
                      Читать далее →
                    </Typography>
                  </CardContent>
                </Card>
              ))}
            </Box>
          </>
        )}

        {/* Article Detail */}
        {activeTab === 0 && selectedArticle && (
          <Card 
            sx={{ 
              p: 4,
              backgroundColor: 'rgba(255, 255, 255, 0.95)',
              boxShadow: '0 4px 20px rgba(126, 87, 194, 0.1)',
            }}
          >
            <Button
              startIcon={<ArrowBackIcon />}
              onClick={() => setSelectedArticle(null)}
              sx={{
                mb: 2,
                color: '#7E57C2',
                '&:hover': {
                  backgroundColor: 'rgba(126, 87, 194, 0.08)',
                },
              }}
            >
              {translations.common.back}
            </Button>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
              <Chip
                label={selectedArticle.category}
                sx={{
                  backgroundColor: 'rgba(126, 87, 194, 0.1)',
                  color: '#7E57C2',
                  fontWeight: 600,
                }}
              />
            </Box>
            <Typography variant="h4" sx={{ fontWeight: 700, mb: 3 }}>
              {selectedArticle.title}
            </Typography>
            <Box
              sx={{
                '& h3': {
                  fontSize: '1.5rem',
                  fontWeight: 700,
                  mt: 4,
                  mb: 2,
                  color: '#5E35B1',
                },
                '& p': {
                  fontSize: '1rem',
                  lineHeight: 1.8,
                  mb: 2,
                  color: '#333',
                },
              }}
              dangerouslySetInnerHTML={{ __html: selectedArticle.content }}
            />
          </Card>
        )}

        {/* FAQ Tab */}
        {activeTab === 1 && (
          <>
            {/* Category Filter */}
            <Stack direction="row" spacing={1} sx={{ mb: 3, flexWrap: 'wrap', gap: 1 }}>
              {faqCategories.map((category) => (
                <Chip
                  key={category}
                  label={category}
                  onClick={() => setSelectedCategory(category)}
                  sx={{
                    backgroundColor: selectedCategory === category
                      ? '#7E57C2'
                      : 'rgba(255, 255, 255, 0.9)',
                    color: selectedCategory === category ? '#fff' : '#7E57C2',
                    fontWeight: 600,
                    border: '1px solid rgba(126, 87, 194, 0.3)',
                    '&:hover': {
                      backgroundColor: selectedCategory === category
                        ? '#5E35B1'
                        : 'rgba(126, 87, 194, 0.15)',
                    },
                  }}
                />
              ))}
            </Stack>

            {/* FAQ Accordions */}
            <Stack spacing={1.5}>
              {filteredFaqs.map((faq) => (
                <Accordion
                  key={faq.id}
                  expanded={expandedFaq === faq.id}
                  onChange={handleFaqChange(faq.id)}
                  sx={{
                    backgroundColor: 'rgba(255, 255, 255, 0.95)',
                    borderRadius: '12px !important',
                    boxShadow: '0 2px 10px rgba(126, 87, 194, 0.08)',
                    '&:before': { display: 'none' },
                    '&.Mui-expanded': {
                      margin: 0,
                      boxShadow: '0 4px 15px rgba(126, 87, 194, 0.15)',
                      borderRadius: '12px !important',
                    },
                  }}
                >
                  <AccordionSummary
                    expandIcon={<ExpandMoreIcon sx={{ color: '#7E57C2' }} />}
                    sx={{
                      borderRadius: '12px',
                      '& .MuiAccordionSummary-content': {
                        alignItems: 'center',
                        gap: 2,
                        my: 1.5,
                      },
                      '&.Mui-expanded': {
                        minHeight: 'auto',
                        borderBottomLeftRadius: 0,
                        borderBottomRightRadius: 0,
                      },
                    }}
                  >
                    <Chip
                      label={faq.category}
                      size="small"
                      sx={{
                        backgroundColor: 'rgba(126, 87, 194, 0.1)',
                        color: '#7E57C2',
                        fontWeight: 600,
                        fontSize: '0.75rem',
                      }}
                    />
                    <Typography sx={{ fontWeight: 600, flex: 1 }}>
                      {faq.question}
                    </Typography>
                  </AccordionSummary>
                  <AccordionDetails 
                    sx={{ 
                      pt: 0,
                      pb: 2.5,
                      px: 3,
                    }}
                  >
                    <Box 
                      sx={{ 
                        pl: 7,
                        borderLeft: '3px solid rgba(126, 87, 194, 0.2)',
                      }}
                    >
                      <Typography
                        sx={{
                          color: 'text.secondary',
                          lineHeight: 1.7,
                        }}
                      >
                        {faq.answer}
                      </Typography>
                    </Box>
                  </AccordionDetails>
                </Accordion>
              ))}
            </Stack>
          </>
        )}
      </Container>
    </Box>
  );
};

export default ArticlesFaqPage;
