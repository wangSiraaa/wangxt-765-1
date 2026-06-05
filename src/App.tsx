import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Layout from '@/components/Layout'
import EventList from '@/pages/EventList'
import EventNew from '@/pages/EventNew'
import EventDetail from '@/pages/EventDetail'
import RectificationList from '@/pages/RectificationList'

export default function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<EventList />} />
          <Route path="/events/new" element={<EventNew />} />
          <Route path="/events/:id" element={<EventDetail />} />
          <Route path="/rectifications" element={<RectificationList />} />
        </Routes>
      </Layout>
    </Router>
  )
}
