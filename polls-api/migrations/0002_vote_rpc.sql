create or replace function api_vote(p_poll_id uuid, p_option_id uuid, p_voter_identifier text default null)
returns void as $$
begin
  -- optional: prevent duplicate if voter identifier provided
  if p_voter_identifier is not null then
    if exists(select 1 from poll_votes where poll_id = p_poll_id and voter_identifier = p_voter_identifier) then
      raise exception 'already_voted';
    end if;
  end if;

  insert into poll_votes (poll_id, option_id, voter_identifier) values (p_poll_id, p_option_id, p_voter_identifier);
  update poll_options set votes = votes + 1 where id = p_option_id;
end;
$$ language plpgsql security definer;
