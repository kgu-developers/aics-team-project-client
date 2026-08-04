import { Link, Outlet } from '@tanstack/react-router';

import { studentPrimaryNavigation } from '~/course/navigation';

export default function StudentShell() {
  return (
    <div className='student-shell'>
      <header className='student-shell__header'>
        <Link className='student-shell__brand' to='/student'>
          OOP Team Project
        </Link>
        <span className='student-shell__role'>학생</span>
      </header>

      <div className='student-shell__body'>
        <nav aria-label='학생 주요 메뉴' className='student-shell__navigation'>
          {studentPrimaryNavigation.map(item => (
            <Link
              activeOptions={{ exact: true }}
              activeProps={{ className: 'student-shell__nav-link is-active' }}
              className='student-shell__nav-link'
              key={item.to}
              to={item.to}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <main className='student-shell__content'>
          <Outlet />
        </main>
      </div>

      <nav aria-label='학생 모바일 메뉴' className='student-shell__mobile-navigation'>
        {studentPrimaryNavigation.map(item => (
          <Link
            activeOptions={{ exact: true }}
            activeProps={{ className: 'student-shell__mobile-link is-active' }}
            className='student-shell__mobile-link'
            key={item.to}
            to={item.to}
          >
            {item.label}
          </Link>
        ))}
      </nav>
    </div>
  );
}
