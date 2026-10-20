-- Sample data for the dashboard.
-- Change the email below if you signed up with a different one.
DO $$
DECLARE
  v_email   TEXT := 'goliya851@gmail.com';
  v_ws      UUID;
  v_user    UUID;
  v_proj    UUID;
  v_names   TEXT[] := ARRAY[
    'Website Redesign', 'Mobile App Launch', 'Customer Portal',
    'Marketing Campaign Q4', 'API Integration', 'Analytics Overhaul'
  ];
  v_status  TEXT[] := ARRAY[
    'in_progress', 'in_progress', 'planning',
    'completed', 'on_hold', 'in_progress'
  ];
  v_titles  TEXT[] := ARRAY[
    'Write requirements', 'Design mockups', 'Set up environment',
    'Build core feature', 'Code review', 'Write tests',
    'Fix reported bugs', 'Update documentation'
  ];
  v_task_st TEXT[] := ARRAY['todo', 'in_progress', 'review', 'done'];
  i INT;
  j INT;
  st TEXT;
BEGIN
  SELECT id, workspace_id INTO v_user, v_ws
  FROM users WHERE email = v_email;

  IF v_ws IS NULL THEN
    RAISE EXCEPTION 'No user found with email %. Edit v_email at the top of the script.', v_email;
  END IF;

  -- Remove earlier sample data for this workspace (tasks cascade from projects)
  DELETE FROM activity_log WHERE workspace_id = v_ws;
  DELETE FROM projects WHERE workspace_id = v_ws;

  FOR i IN 1..array_length(v_names, 1) LOOP
    INSERT INTO projects (workspace_id, name, status, created_at)
    VALUES (v_ws, v_names[i], v_status[i], NOW() - (i * INTERVAL '9 days'))
    RETURNING id INTO v_proj;

    FOR j IN 1..8 LOOP
      -- Completed projects have every task done; others get a mix
      IF v_status[i] = 'completed' THEN
        st := 'done';
      ELSIF v_status[i] = 'planning' THEN
        st := CASE WHEN j <= 6 THEN 'todo' ELSE 'in_progress' END;
      ELSE
        st := v_task_st[1 + ((j + i) % 4)];
      END IF;

      INSERT INTO tasks (workspace_id, project_id, title, status, created_at)
      VALUES (v_ws, v_proj, v_titles[j], st, NOW() - ((j + i) * INTERVAL '1 day'));
    END LOOP;
  END LOOP;

  -- About 90 days of activity, 0 to 5 events per day
  FOR i IN 0..89 LOOP
    FOR j IN 1..(floor(random() * 6))::int LOOP
      INSERT INTO activity_log (workspace_id, user_id, action, created_at)
      VALUES (
        v_ws,
        v_user,
        (ARRAY[
          'completed task "Build core feature"',
          'created project "Customer Portal"',
          'commented on "Design mockups"',
          'moved "Write tests" to review',
          'updated project "Website Redesign"',
          'closed 3 bug reports'
        ])[1 + floor(random() * 6)::int],
        NOW() - (i * INTERVAL '1 day') - (floor(random() * 600) * INTERVAL '1 minute')
      );
    END LOOP;
  END LOOP;

  -- Make sure there is always something in "Recent activity"
  INSERT INTO activity_log (workspace_id, user_id, action, created_at)
  VALUES
    (v_ws, v_user, 'logged in to the dashboard', NOW()),
    (v_ws, v_user, 'completed task "Update documentation"', NOW() - INTERVAL '2 hours');
END $$;
